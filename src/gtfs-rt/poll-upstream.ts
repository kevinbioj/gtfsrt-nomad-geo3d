import GtfsRealtime from "gtfs-realtime-bindings";

import { POLL_INTERVAL_MS, TRIP_CACHE_PATH, TRIP_UPDATES_URL, VEHICLE_POSITIONS_URL } from "../config.js";
import type { GtfsResource } from "../gtfs/import-resource.js";
import type { GtfsResourceHolder } from "../gtfs/load-resource.js";
import { type Call, findStopIndex } from "../matching/align-calls.js";
import { formatStartDate, matchRunningTrip, matchTimedTrip, type TripMatch } from "../matching/match-trip.js";
import { useTripCache } from "../matching/trip-cache.js";
import { useVehicleLocator } from "./locate-vehicle.js";

export type RealtimeStore = ReturnType<typeof useUpstreamFeeds>;

async function fetchFeed(url: string) {
	const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

	if (!response.ok) {
		throw new Error(`Failed to fetch feed at '${url}' (HTTP ${response.status})`);
	}

	return GtfsRealtime.transit_realtime.FeedMessage.decode(new Uint8Array(await response.arrayBuffer()));
}

/** Horaire théorique Geo3D : l'heure annoncée moins le retard (souvent absent, donc nul). */
function scheduledTime(event: GtfsRealtime.transit_realtime.TripUpdate.IStopTimeEvent | null | undefined) {
	if (!event?.time) return undefined;
	return Number(event.time) - (event.delay ?? 0);
}

function toCalls(stopTimeUpdates: GtfsRealtime.transit_realtime.TripUpdate.IStopTimeUpdate[]): Call[] {
	return stopTimeUpdates.map((stopTimeUpdate) => ({
		stopId: stopTimeUpdate.stopId ?? "",
		arrival: scheduledTime(stopTimeUpdate.arrival),
		departure: scheduledTime(stopTimeUpdate.departure),
	}));
}

/** Identifie le véhicule par son numéro de parc (label) plutôt que par l'identifiant matériel Geo3D. */
function rewriteVehicle(vehicle: GtfsRealtime.transit_realtime.IVehicleDescriptor | null | undefined) {
	if (vehicle?.label) vehicle.id = vehicle.label;
}

/** Remplace le descripteur de course Geo3D par celui de la course classique appariée. */
function rewriteTrip(trip: GtfsRealtime.transit_realtime.ITripDescriptor, match: TripMatch) {
	trip.tripId = match.trip.id;
	trip.routeId = match.trip.routeId;
	trip.startDate = formatStartDate(match.startDate);
	if (match.trip.directionId !== undefined) trip.directionId = match.trip.directionId;
}

export function useUpstreamFeeds(gtfsResource: GtfsResourceHolder) {
	const store = {
		tripUpdates: [] as GtfsRealtime.transit_realtime.IFeedEntity[],
		tripUpdatesTimestamp: 0,
		vehiclePositions: [] as GtfsRealtime.transit_realtime.IFeedEntity[],
		vehiclePositionsTimestamp: 0,
	};

	const tripCache = useTripCache(TRIP_CACHE_PATH);
	const { locateVehicle, sweepVehicleStates } = useVehicleLocator();

	/**
	 * Appariements du dernier cycle, indexés par identifiant de course Hanover, réutilisés par les positions.
	 * `null` : course vue dans les trip updates mais non rattachée (ou écartée au profit d'une autre).
	 */
	let currentMatches = new Map<string, TripMatch | null>();

	function resolveTrip(gtfs: GtfsResource, rtTripId: string, line: string, calls: Call[], now: Temporal.Instant) {
		const timedMatch = matchTimedTrip(gtfs, line, calls);
		if (timedMatch !== undefined) {
			tripCache.remember(rtTripId, line, calls, timedMatch);
			return timedMatch;
		}

		const hasTimes = calls.some((call) => call.arrival !== undefined || call.departure !== undefined);
		if (hasTimes) return undefined;

		return tripCache.recall(gtfs, rtTripId, line, calls) ?? matchRunningTrip(gtfs, line, calls, now);
	}

	async function pollTripUpdates(now: Temporal.Instant) {
		const feed = await fetchFeed(TRIP_UPDATES_URL);
		const { gtfs } = gtfsResource;

		const matches = new Map<string, TripMatch | null>();
		const entitiesByTrip = new Map<
			string,
			{ entity: GtfsRealtime.transit_realtime.IFeedEntity; rtTripId: string; score: number }
		>();

		for (const entity of feed.entity) {
			const tripUpdate = entity.tripUpdate;
			const rtTripId = tripUpdate?.trip.tripId;
			const rtRouteId = tripUpdate?.trip.routeId;
			if (!tripUpdate || !rtTripId || !rtRouteId) continue;

			const calls = toCalls(tripUpdate.stopTimeUpdate ?? []);
			const match = resolveTrip(gtfs, rtTripId, rtRouteId, calls, now);
			matches.set(rtTripId, match ?? null);
			if (match === undefined) {
				console.warn(`    ⛛ [${rtTripId}] No matching trip on route '${rtRouteId}', dropping trip update.`);
				continue;
			}

			// Deux courses Hanover ne peuvent pas désigner la même course classique : on garde la plus proche.
			const tripKey = `${match.trip.id}:${formatStartDate(match.startDate)}`;
			const concurrent = entitiesByTrip.get(tripKey);
			if (concurrent !== undefined) {
				const loser = concurrent.score <= match.score ? rtTripId : concurrent.rtTripId;
				matches.set(loser, null);
				console.warn(`    ⛛ [${loser}] Trip '${tripKey}' is already claimed, dropping trip update.`);
				if (loser === rtTripId) continue;
			}

			rewriteTrip(tripUpdate.trip, match);
			rewriteVehicle(tripUpdate.vehicle);
			tripUpdate.stopTimeUpdate = (tripUpdate.stopTimeUpdate ?? []).flatMap((stopTimeUpdate, callIndex) => {
				const stopIndex = match.alignment[callIndex];
				if (stopIndex === undefined) return [];

				// biome-ignore lint/style/noNonNullAssertion: alignment only contains valid indices
				const stop = match.trip.stops[stopIndex]!;
				stopTimeUpdate.stopId = stop.stopId;
				stopTimeUpdate.stopSequence = stop.sequence;
				if (stopTimeUpdate.arrival?.time) {
					stopTimeUpdate.arrival.delay = Number(stopTimeUpdate.arrival.time) - (match.serviceBase + stop.arrival);
				}
				if (stopTimeUpdate.departure?.time) {
					stopTimeUpdate.departure.delay = Number(stopTimeUpdate.departure.time) - (match.serviceBase + stop.departure);
				}
				return [stopTimeUpdate];
			});
			// Le SAEIV et le GTFS classique peuvent desservir deux arrêts voisins dans un ordre différent.
			tripUpdate.stopTimeUpdate.sort((a, b) => (a.stopSequence ?? 0) - (b.stopSequence ?? 0));
			entity.id = `ET:${tripKey}`;

			entitiesByTrip.set(tripKey, { entity, rtTripId, score: match.score });
		}

		currentMatches = matches;
		store.tripUpdates = [...entitiesByTrip.values()].map(({ entity }) => entity);
		store.tripUpdatesTimestamp = Number(feed.header.timestamp ?? 0);
	}

	async function pollVehiclePositions() {
		const feed = await fetchFeed(VEHICLE_POSITIONS_URL);
		const { gtfs } = gtfsResource;

		for (const entity of feed.entity) {
			const vehicle = entity.vehicle;
			if (!vehicle) continue;

			rewriteVehicle(vehicle.vehicle);
			if (vehicle.vehicle?.id) entity.id = `VM:${vehicle.vehicle.id}`;

			const rtTripId = vehicle.trip?.tripId;
			const rtRouteId = vehicle.trip?.routeId;
			const routeId = rtRouteId ? gtfs.routesByShortName.get(rtRouteId) : undefined;
			const match =
				rtTripId && rtRouteId
					? currentMatches.has(rtTripId)
						? (currentMatches.get(rtTripId) ?? undefined)
						: tripCache.recall(gtfs, rtTripId, rtRouteId, undefined)
					: undefined;

			if (vehicle.trip && rtRouteId && match !== undefined) {
				rewriteTrip(vehicle.trip, match);

				// Le tracé de la course classique situe le véhicule plus finement que l'arrêt annoncé par Geo3D,
				// qui ne sert plus que de repli lorsque la projection est impossible.
				const tripKey = `${match.trip.id}:${formatStartDate(match.startDate)}`;
				if (locateVehicle(vehicle, match.trip, tripKey, gtfs)) continue;

				const stopIndex = vehicle.stopId ? findStopIndex(match.trip, rtRouteId, vehicle.stopId) : undefined;
				const stop = stopIndex !== undefined ? match.trip.stops[stopIndex] : undefined;
				if (stop !== undefined) {
					vehicle.stopId = stop.stopId;
					vehicle.currentStopSequence = stop.sequence;
				} else {
					delete vehicle.stopId;
					delete vehicle.currentStopSequence;
					delete vehicle.currentStatus;
				}
				continue;
			}

			// Course introuvable : le véhicule reste publié, rattaché à sa seule ligne.
			if (rtTripId) {
				console.warn(`    ⛛ [${rtTripId}] No matching trip for vehicle '${vehicle.vehicle?.id}', keeping route only.`);
			}
			if (routeId !== undefined) {
				vehicle.trip = { routeId };
			} else {
				delete vehicle.trip;
			}
			delete vehicle.stopId;
			delete vehicle.currentStopSequence;
			delete vehicle.currentStatus;
		}

		sweepVehicleStates();

		store.vehiclePositions = feed.entity;
		store.vehiclePositionsTimestamp = Number(feed.header.timestamp ?? 0);
	}

	async function poll() {
		const startedAt = Date.now();
		const now = Temporal.Now.instant();

		// Les positions s'appuient sur les appariements des trip updates : on les traite donc à la suite.
		try {
			await pollTripUpdates(now);
		} catch (cause) {
			console.error("✘ Trip updates poll failed, keeping last known feed", cause);
		}

		try {
			await pollVehiclePositions();
		} catch (cause) {
			console.error("✘ Vehicle positions poll failed, keeping last known feed", cause);
		}

		await tripCache.persist(now);

		setTimeout(poll, Math.max(POLL_INTERVAL_MS - (Date.now() - startedAt), 0));
	}

	void poll();

	return store;
}
