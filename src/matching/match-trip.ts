import { MAX_TIME_DEVIATION } from "../config.js";
import type { GtfsResource, Trip } from "../gtfs/import-resource.js";

import { alignCalls, type Call, isMappedStop } from "./align-calls.js";

const TIMEZONE = "Europe/Paris";

/** Marge autour des horaires théoriques pendant laquelle une course sans horaire est considérée en circulation. */
const RUNNING_WINDOW_MARGIN = 30 * 60;

export type TripMatch = {
	trip: Trip;
	startDate: Temporal.PlainDate;
	/** Instant de référence du jour de service (midi moins 12 h), en secondes depuis l'epoch. */
	serviceBase: number;
	/** Pour chaque passage Geo3D, l'indice de l'arrêt classique correspondant. */
	alignment: (number | undefined)[];
	/** Somme des écarts horaires, en secondes (plus c'est bas, meilleur est l'appariement). */
	score: number;
};

export function getServiceBase(date: Temporal.PlainDate) {
	const noon = date.toZonedDateTime({ timeZone: TIMEZONE, plainTime: Temporal.PlainTime.from("12:00") });
	return noon.subtract({ hours: 12 }).epochMilliseconds / 1000;
}

export function formatStartDate(date: Temporal.PlainDate) {
	return date.toString().replaceAll("-", "");
}

function toPlainDate(epochSeconds: number) {
	return Temporal.Instant.fromEpochMilliseconds(epochSeconds * 1000)
		.toZonedDateTimeISO(TIMEZONE)
		.toPlainDate();
}

/**
 * Les arrêts Geo3D absents de la table de correspondance (non desservis dans le GTFS classique) sont ignorés ;
 * parmi les autres, on tolère un seul arrêt que la course classique ne dessert pas.
 */
function isAlignmentAcceptable(calls: Call[], alignment: (number | undefined)[], line: string) {
	const mapped = calls.filter((call) => isMappedStop(line, call.stopId)).length;
	const aligned = alignment.filter((index) => index !== undefined).length;
	return aligned >= Math.min(2, mapped) && mapped - aligned <= 1;
}

function* listCandidates(gtfs: GtfsResource, line: string, calls: Call[], referenceDate: Temporal.PlainDate) {
	const routeId = gtfs.routesByShortName.get(line);
	const trips = routeId !== undefined ? (gtfs.tripsByRoute.get(routeId) ?? []) : [];

	// La veille est également examinée pour les courses qui circulent après minuit.
	for (const startDate of [referenceDate, referenceDate.subtract({ days: 1 })]) {
		const serviceBase = getServiceBase(startDate);
		for (const trip of trips) {
			if (trip.stops.length === 0 || !gtfs.isServiceActive(trip.serviceId, startDate)) continue;

			const alignment = alignCalls(calls, trip, line);
			if (!isAlignmentAcceptable(calls, alignment, line)) continue;

			yield { trip, startDate, serviceBase, alignment };
		}
	}
}

/**
 * Retrouve la course du GTFS classique correspondant à une course Geo3D horodatée : même ligne, arrêts
 * desservis dans le même ordre et horaires théoriques les plus proches (écart borné par `MAX_TIME_DEVIATION`).
 */
export function matchTimedTrip(gtfs: GtfsResource, line: string, calls: Call[]): TripMatch | undefined {
	const firstTime = calls.map((call) => call.departure ?? call.arrival).find((time) => time !== undefined);
	if (firstTime === undefined) return undefined;

	let best: TripMatch | undefined;
	let bestMissed = 0;
	for (const candidate of listCandidates(gtfs, line, calls, toPlainDate(firstTime))) {
		let score = 0;
		let timedCalls = 0;
		let rejected = false;

		calls.forEach((call, callIndex) => {
			const stopIndex = candidate.alignment[callIndex];
			if (stopIndex === undefined || rejected) return;

			// biome-ignore lint/style/noNonNullAssertion: alignment only contains valid indices
			const stop = candidate.trip.stops[stopIndex]!;
			const deviation =
				call.arrival !== undefined
					? Math.abs(call.arrival - (candidate.serviceBase + stop.arrival))
					: call.departure !== undefined
						? Math.abs(call.departure - (candidate.serviceBase + stop.departure))
						: undefined;
			if (deviation === undefined) return;

			if (deviation > MAX_TIME_DEVIATION) {
				rejected = true;
				return;
			}

			score += deviation;
			timedCalls += 1;
		});

		if (rejected || timedCalls === 0) continue;
		// Une course qui dessert davantage de passages Geo3D l'emporte (ex. Évreux > Rouen face au renfort
		// Louviers > Rouen du lundi, aux mêmes horaires sur leur tronçon commun), puis la plus proche en horaires.
		const missed = candidate.alignment.filter((index) => index === undefined).length;
		if (best === undefined || missed < bestMissed || (missed === bestMissed && score < best.score)) {
			best = { ...candidate, score };
			bestMissed = missed;
		}
	}

	return best;
}

/**
 * Dernier recours pour une course Geo3D sans aucun horaire (tous les passages en NO_DATA) et inconnue du cache :
 * on ne la rattache que si une seule course classique compatible est en circulation à cet instant.
 */
export function matchRunningTrip(
	gtfs: GtfsResource,
	line: string,
	calls: Call[],
	now: Temporal.Instant,
): TripMatch | undefined {
	const nowSeconds = now.epochMilliseconds / 1000;

	let match: TripMatch | undefined;
	for (const candidate of listCandidates(gtfs, line, calls, toPlainDate(nowSeconds))) {
		// biome-ignore lint/style/noNonNullAssertion: candidates always have stops
		const startsAt = candidate.serviceBase + candidate.trip.stops[0]!.departure;
		// biome-ignore lint/style/noNonNullAssertion: candidates always have stops
		const endsAt = candidate.serviceBase + candidate.trip.stops.at(-1)!.arrival;
		if (nowSeconds < startsAt - RUNNING_WINDOW_MARGIN || nowSeconds > endsAt + RUNNING_WINDOW_MARGIN) continue;

		if (match !== undefined) return undefined;
		match = { ...candidate, score: Number.POSITIVE_INFINITY };
	}

	return match;
}
