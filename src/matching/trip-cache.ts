import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { GtfsResource } from "../gtfs/import-resource.js";

import { alignCalls, type Call } from "./align-calls.js";
import { getServiceBase, type TripMatch } from "./match-trip.js";

/** Durée pendant laquelle un appariement est conservé après la fin théorique de la course. */
const RETENTION_AFTER_END = 2 * 3600;

type CacheEntry = {
	/** Numéro de ligne (route_id Geo3D). */
	line: string;
	/** Suite des arrêts Geo3D : si elle change, l'identifiant Hanover désigne une autre course. */
	fingerprint: string;
	tripId: string;
	startDate: string;
	endsAt: number;
};

function fingerprintOf(calls: Call[]) {
	return calls.map((call) => call.stopId).join(">");
}

/**
 * Mémorise, pour chaque identifiant de course Hanover, la course classique qui lui a été associée.
 * Les identifiants Hanover changent d'un jour à l'autre, mais une course du jour garde le sien : cela permet
 * de continuer à la rattacher une fois ses horaires remplacés par des NO_DATA (typiquement pendant qu'elle roule).
 */
export function useTripCache(path: string) {
	const entries = new Map<string, CacheEntry>();

	try {
		const persisted = JSON.parse(readFileSync(path, "utf-8")) as Record<string, CacheEntry>;
		for (const [rtTripId, entry] of Object.entries(persisted)) entries.set(rtTripId, entry);
		console.log(`➔ Restored ${entries.size} trip matches from '${path}'.`);
	} catch {
		console.log(`➔ No trip matches to restore from '${path}'.`);
	}

	function remember(rtTripId: string, line: string, calls: Call[], match: TripMatch) {
		entries.set(rtTripId, {
			line,
			fingerprint: fingerprintOf(calls),
			tripId: match.trip.id,
			startDate: match.startDate.toString(),
			// biome-ignore lint/style/noNonNullAssertion: matched trips always have stops
			endsAt: match.serviceBase + match.trip.stops.at(-1)!.arrival,
		});
	}

	/** Restitue l'appariement mémorisé, à condition que la course Hanover n'ait pas changé de nature. */
	function recall(
		gtfs: GtfsResource,
		rtTripId: string,
		line: string,
		calls: Call[] | undefined,
	): TripMatch | undefined {
		const entry = entries.get(rtTripId);
		if (entry === undefined || entry.line !== line) return undefined;
		if (calls !== undefined && entry.fingerprint !== fingerprintOf(calls)) return undefined;

		const trip = gtfs.trips.get(entry.tripId);
		if (trip === undefined) return undefined;

		const startDate = Temporal.PlainDate.from(entry.startDate);
		return {
			trip,
			startDate,
			serviceBase: getServiceBase(startDate),
			alignment: calls !== undefined ? alignCalls(calls, trip, line) : [],
			score: Number.POSITIVE_INFINITY,
		};
	}

	async function persist(now: Temporal.Instant) {
		const nowSeconds = now.epochMilliseconds / 1000;
		for (const [rtTripId, entry] of entries) {
			if (entry.endsAt + RETENTION_AFTER_END < nowSeconds) entries.delete(rtTripId);
		}

		try {
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, JSON.stringify(Object.fromEntries(entries)));
		} catch (cause) {
			console.error(`✘ Failed to persist trip matches to '${path}'`, cause);
		}
	}

	return { remember, recall, persist };
}
