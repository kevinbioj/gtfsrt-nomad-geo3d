import { join } from "node:path";

import { parseCsv } from "../utils/parse-csv.js";

export type TripStop = {
	sequence: number;
	stopId: string;
	latitude: number;
	longitude: number;
	/** Secondes depuis « midi moins 12 h » du jour de service (peut dépasser 24 h). */
	arrival: number;
	departure: number;
};

export type Trip = {
	id: string;
	routeId: string;
	serviceId: string;
	directionId: number | undefined;
	stops: TripStop[];
};

export type GtfsResource = Awaited<ReturnType<typeof importResource>>;

export async function importResource(directory: string) {
	const routesByShortName = await importRoutes(directory);
	const isServiceActive = await importServices(directory);
	const trips = await importTrips(directory);

	const tripsByRoute = new Map<string, Trip[]>();
	trips.forEach((trip) => {
		let routeTrips = tripsByRoute.get(trip.routeId);
		if (routeTrips === undefined) {
			routeTrips = [];
			tripsByRoute.set(trip.routeId, routeTrips);
		}
		routeTrips.push(trip);
	});

	return { routesByShortName, isServiceActive, trips, tripsByRoute };
}

type RouteRecord = { route_id: string; route_short_name: string };

async function importRoutes(directory: string) {
	const routesByShortName = new Map<string, string>();

	await parseCsv<RouteRecord>(join(directory, "routes.txt"), (routeRecord) => {
		routesByShortName.set(routeRecord.route_short_name, routeRecord.route_id);
	});

	return routesByShortName;
}

type CalendarRecord = {
	service_id: string;
	monday: string;
	tuesday: string;
	wednesday: string;
	thursday: string;
	friday: string;
	saturday: string;
	sunday: string;
	start_date: string;
	end_date: string;
};

type CalendarDateRecord = { service_id: string; date: string; exception_type: string };

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function parseDate(date: string) {
	return Temporal.PlainDate.from({ year: +date.slice(0, 4), month: +date.slice(4, 6), day: +date.slice(6, 8) });
}

async function importServices(directory: string) {
	const calendars = new Map<string, { days: boolean[]; startDate: Temporal.PlainDate; endDate: Temporal.PlainDate }>();
	const exceptions = new Map<string, Map<string, boolean>>();

	await parseCsv<CalendarRecord>(join(directory, "calendar.txt"), (calendarRecord) => {
		calendars.set(calendarRecord.service_id, {
			days: WEEKDAYS.map((weekday) => calendarRecord[weekday] === "1"),
			startDate: parseDate(calendarRecord.start_date),
			endDate: parseDate(calendarRecord.end_date),
		});
	});

	await parseCsv<CalendarDateRecord>(join(directory, "calendar_dates.txt"), (calendarDateRecord) => {
		let serviceExceptions = exceptions.get(calendarDateRecord.service_id);
		if (serviceExceptions === undefined) {
			serviceExceptions = new Map();
			exceptions.set(calendarDateRecord.service_id, serviceExceptions);
		}
		serviceExceptions.set(calendarDateRecord.date, calendarDateRecord.exception_type === "1");
	});

	return (serviceId: string, date: Temporal.PlainDate) => {
		const exception = exceptions.get(serviceId)?.get(date.toString().replaceAll("-", ""));
		if (exception !== undefined) return exception;

		const calendar = calendars.get(serviceId);
		if (calendar === undefined) return false;

		return (
			Temporal.PlainDate.compare(calendar.startDate, date) <= 0 &&
			Temporal.PlainDate.compare(date, calendar.endDate) <= 0 &&
			calendar.days[date.dayOfWeek - 1] === true
		);
	};
}

type StopRecord = { stop_id: string; stop_lat: string; stop_lon: string };

type TripRecord = { trip_id: string; route_id: string; service_id: string; direction_id?: string };

type StopTimeRecord = {
	trip_id: string;
	stop_id: string;
	stop_sequence: string;
	arrival_time: string;
	departure_time: string;
};

function parseTime(time: string) {
	const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
	return hours * 3600 + minutes * 60 + seconds;
}

async function importTrips(directory: string) {
	const stops = new Map<string, { latitude: number; longitude: number }>();
	const trips = new Map<string, Trip>();

	await parseCsv<StopRecord>(join(directory, "stops.txt"), (stopRecord) => {
		stops.set(stopRecord.stop_id, { latitude: +stopRecord.stop_lat, longitude: +stopRecord.stop_lon });
	});

	await parseCsv<TripRecord>(join(directory, "trips.txt"), (tripRecord) => {
		trips.set(tripRecord.trip_id, {
			id: tripRecord.trip_id,
			routeId: tripRecord.route_id,
			serviceId: tripRecord.service_id,
			directionId: tripRecord.direction_id ? +tripRecord.direction_id : undefined,
			stops: [],
		});
	});

	await parseCsv<StopTimeRecord>(join(directory, "stop_times.txt"), (stopTimeRecord) => {
		const trip = trips.get(stopTimeRecord.trip_id);
		const stop = stops.get(stopTimeRecord.stop_id);
		if (trip === undefined || stop === undefined) {
			return;
		}

		trip.stops.push({
			sequence: +stopTimeRecord.stop_sequence,
			stopId: stopTimeRecord.stop_id,
			latitude: stop.latitude,
			longitude: stop.longitude,
			arrival: parseTime(stopTimeRecord.arrival_time || stopTimeRecord.departure_time),
			departure: parseTime(stopTimeRecord.departure_time || stopTimeRecord.arrival_time),
		});
	});

	trips.forEach((trip) => {
		trip.stops.sort((a, b) => a.sequence - b.sequence);
	});

	return trips;
}
