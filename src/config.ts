function envNumber(name: string, fallback: number): number {
	const v = process.env[name];
	if (!v) return fallback;
	const n = Number(v);
	if (!Number.isFinite(n)) throw new Error(`Env var ${name} must be a number, got '${v}'`);
	return n;
}

export const PORT = envNumber("PORT", 3000);
export const GTFS_RESOURCE_URL = process.env.GTFS_RESOURCE_URL ?? "https://gtfs.bus-tracker.fr/nomad.zip";

export const TRIP_UPDATES_URL =
	process.env.TRIP_UPDATES_URL ?? "https://lrn.geo3d.hanoverdisplays.com/api-1.0/gtfs-rt/trip-updates";
export const VEHICLE_POSITIONS_URL =
	process.env.VEHICLE_POSITIONS_URL ?? "https://lrn.geo3d.hanoverdisplays.com/api-1.0/gtfs-rt/vehicle-positions";

export const POLL_INTERVAL_MS = envNumber("POLL_INTERVAL_MS", 15_000);

/** Écart maximal, en secondes, entre un horaire Geo3D et l'horaire théorique de la course classique. */
export const MAX_TIME_DEVIATION = envNumber("MAX_TIME_DEVIATION", 600);

/** Fichier de persistance des appariements de courses, pour survivre aux redémarrages. */
export const TRIP_CACHE_PATH = process.env.TRIP_CACHE_PATH ?? "data/trip-cache.json";

/** Distance restante jusqu'au prochain arrêt, en mètres, en dessous de laquelle on considère le véhicule à quai. */
export const STOPPED_AT_RADIUS = envNumber("STOPPED_AT_RADIUS", 30);
/** Idem pour l'approche de l'arrêt. */
export const INCOMING_AT_RADIUS = envNumber("INCOMING_AT_RADIUS", 1500);
/** Recul autorisé, en mètres, lors de la reprise de la projection d'un véhicule déjà localisé. */
export const BACKWARD_TOLERANCE = envNumber("BACKWARD_TOLERANCE", 150);
/** Écart maximal, en mètres, entre un véhicule et le tracé de sa course au-delà duquel on renonce à le situer. */
export const MAX_SHAPE_OFFSET = envNumber("MAX_SHAPE_OFFSET", 150);
