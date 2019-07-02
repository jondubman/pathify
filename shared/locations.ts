// Shared code (client + server) having to do specifically with location events and locations themselves.

export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];

import timeseries, { EventFilter, EventType, GenericEvent, Timepoint } from './timeseries';

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

const locEventFilter: EventFilter = (event: GenericEvent) => (event.type == EventType.LOC);

const locations = {

  // Return a single LOC event (or null if none found within the "near" threshold) nearest in time to given Timepoint t.
  locEventNearestTimepoint: (events: GenericEvent[], t: Timepoint, near: number): LocationEvent | null  => {

    const nearestMatches: LocationEvent[] =
      timeseries.findEventsNearestTimepoint(events, t, true, true, near, locEventFilter) as LocationEvent[];

    if (!nearestMatches.length) {
      return null;
    } else {
      return nearestMatches[0]; // TODO this should be good enough
    }
  }
}

export default locations;
