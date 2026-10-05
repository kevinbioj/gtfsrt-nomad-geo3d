import { STOP_MAPPING } from "../geo3d/stop-mapping.js";
import type { Trip } from "../gtfs/import-resource.js";

export type Call = {
	/** Identifiant d'arrêt Geo3D. */
	stopId: string;
	/** Horaires théoriques Geo3D (heure annoncée moins le retard), en secondes depuis l'epoch. */
	arrival: number | undefined;
	departure: number | undefined;
};

/** Indique si l'arrêt Geo3D figure dans la table de correspondance de la ligne. */
export function isMappedStop(line: string, geo3dStopId: string) {
	return STOP_MAPPING.get(line)?.has(geo3dStopId) ?? false;
}

/**
 * Indice, dans les arrêts de la course classique, du quai correspondant à l'arrêt Geo3D donné.
 * Si la course le dessert plusieurs fois (boucle), on privilégie le premier passage à partir de `fromIndex`.
 * L'ordre n'est pas imposé pour autant : le SAEIV et le GTFS classique ne s'accordent pas toujours sur l'ordre
 * de desserte de deux arrêts voisins (ex. La Ferté-Macé sur les 407 et 423).
 */
export function findStopIndex(trip: Trip, line: string, geo3dStopId: string, fromIndex = 0) {
	const stopIds = STOP_MAPPING.get(line)?.get(geo3dStopId);
	if (stopIds === undefined) return undefined;

	let fallback: number | undefined;
	for (let index = 0; index < trip.stops.length; index += 1) {
		// biome-ignore lint/style/noNonNullAssertion: index is bound by the loop
		if (!stopIds.includes(trip.stops[index]!.stopId)) continue;
		if (index >= fromIndex) return index;
		fallback ??= index;
	}

	return fallback;
}

/** Associe chaque passage Geo3D au quai correspondant de la course classique. */
export function alignCalls(calls: Call[], trip: Trip, line: string) {
	const alignment: (number | undefined)[] = [];
	let fromIndex = 0;

	for (const call of calls) {
		const index = findStopIndex(trip, line, call.stopId, fromIndex);
		alignment.push(index);
		if (index !== undefined) fromIndex = index + 1;
	}

	return alignment;
}
