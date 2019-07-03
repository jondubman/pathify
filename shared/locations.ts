// Shared code (client + server) having to do specifically with location events and locations themselves.

export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];

import timeseries, { EventFilter, EventType, GenericEvent, GenericEvents, Timepoint } from './timeseries';

export interface LocationEvent extends GenericEvent {
  data: {
    ele?: number;
    heading?: number;
    lat: Lat;
    lon: Lon;
    odo?: number;
    speed?: number;
    // TODO battery level?
  }
}

export type LocationEvents = LocationEvent[];

const locEventFilter: EventFilter = (event: GenericEvent) => (event.type == EventType.LOC);

const locations = {

  // Return a single LOC event (or null if none found within the "near" threshold) nearest in time to given Timepoint t.
  locEventNearestTimepoint: (events: GenericEvents, t: Timepoint, near: number): LocationEvent | null  => {

    const nearestMatches: LocationEvents =
      timeseries.findEventsNearestTimepoint(events, t, true, true, near, locEventFilter) as LocationEvents;

    if (!nearestMatches.length) {
      return null;
    } else {
      return nearestMatches[0]; // TODO this should be good enough
    }
  }
}

export default locations;
