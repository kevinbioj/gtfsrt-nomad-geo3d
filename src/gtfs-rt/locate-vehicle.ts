import GtfsRealtime from "gtfs-realtime-bindings";

import { BACKWARD_TOLERANCE, INCOMING_AT_RADIUS, MAX_SHAPE_OFFSET, STOPPED_AT_RADIUS } from "../config.js";
import type { GtfsResource, Trip, TripStop } from "../gtfs/import-resource.js";
import { findSegmentIndex, projectOnShape } from "../gtfs/project-on-shape.js";

const { VehicleStopStatus } = GtfsRealtime.transit_realtime.VehiclePosition;

type VehicleState = { tripKey: string; distance: number };

export function useVehicleLocator() {
	let states = new Map<string, VehicleState>();
	let nextStates = new Map<string, VehicleState>();

	/**
	 * Détermine `currentStatus`, `currentStopSequence` et `stopId` en projetant la position du véhicule
	 * sur le tracé de la course classique appariée. Renvoie `false`, sans toucher au véhicule, si la course
	 * n'a pas de tracé exploitable ou si le véhicule s'en trouve trop éloigné.
	 *
	 * `tripKey` identifie la course circulée (course et jour de service) : la projection précédente
	 * ne sert de point de départ que sur cette même course.
	 */
	function locateVehicle(
		vehicle: GtfsRealtime.transit_realtime.IVehiclePosition,
		trip: Trip,
		tripKey: string,
		gtfs: GtfsResource,
	) {
		const vehicleId = vehicle.vehicle?.id;
		const position = vehicle.position;
		if (!vehicleId || !position) return false;

		const shape = trip.shapeId !== undefined ? gtfs.shapes.get(trip.shapeId) : undefined;
		const stops = trip.stops.filter((stop) => Number.isFinite(stop.distance));
		if (shape === undefined || stops.length === 0) return false;

		const previousState = states.get(vehicleId);
		const fromIndex =
			previousState?.tripKey === tripKey ? findSegmentIndex(shape, previousState.distance - BACKWARD_TOLERANCE) : 0;

		const projection = projectOnShape(shape, position.latitude, position.longitude, fromIndex);
		// Loin de son tracé, le véhicule est dévié ou n'effectue pas la course qu'on lui prête.
		if (projection === undefined || projection.offset > MAX_SHAPE_OFFSET) return false;

		const { stop, remaining } = resolveCurrentStop(stops, projection.distance);

		vehicle.currentStatus =
			remaining <= STOPPED_AT_RADIUS
				? VehicleStopStatus.STOPPED_AT
				: remaining <= INCOMING_AT_RADIUS
					? VehicleStopStatus.INCOMING_AT
					: VehicleStopStatus.IN_TRANSIT_TO;
		vehicle.currentStopSequence = stop.sequence;
		vehicle.stopId = stop.stopId;

		nextStates.set(vehicleId, { tripKey, distance: projection.distance });
		return true;
	}

	/** Oublie les véhicules absents du dernier cycle de localisation. */
	function sweepVehicleStates() {
		states = nextStates;
		nextStates = new Map();
	}

	return { locateVehicle, sweepVehicleStates };
}

/**
 * Rattache une abscisse curviligne à un arrêt de la course, et renvoie la distance qu'il reste à parcourir
 * pour l'atteindre. Un véhicule à quai finit par dépasser la borne de son arrêt de quelques mètres : tant
 * qu'il ne s'en est pas éloigné, on continue de le rattacher à cet arrêt plutôt qu'au suivant.
 */
function resolveCurrentStop(stops: TripStop[], distance: number) {
	const aheadIndex = stops.findIndex((stop) => stop.distance >= distance);

	// Passé le dernier arrêt, le véhicule est arrivé à son terminus.
	if (aheadIndex === -1) {
		// biome-ignore lint/style/noNonNullAssertion: stops is not empty
		return { stop: stops.at(-1)!, remaining: 0 };
	}

	// biome-ignore lint/style/noNonNullAssertion: aheadIndex is a valid index
	const ahead = stops[aheadIndex]!;
	const behind = aheadIndex > 0 ? stops[aheadIndex - 1] : undefined;

	if (behind !== undefined && distance - behind.distance <= STOPPED_AT_RADIUS) {
		return { stop: behind, remaining: 0 };
	}

	return { stop: ahead, remaining: ahead.distance - distance };
}
