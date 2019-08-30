// Shared code (client + server) having to do specifically with location events and locations themselves.

import * as turf from '@turf/helpers';
import distance from '@turf/distance';

export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];

import log from './log';
import sharedConstants from './sharedConstants';
import timeseries, {
  EventFilter,
  EventType,
  GenericEvent,
  GenericEvents,
  Timepoint,
  TimeRange
} from './timeseries';

export interface LocationEvent extends GenericEvent {
  accuracy?: number; // meters
  ele?: number; // meters
  extra?: string; // for debugging
  heading?: number; // 0 <= degrees < 360
  loc: LonLat;
  odo?: number; // meters
  speed?: number; // mph (converted from meters per second)
  // TODO battery level?
}

export type LocationEvents = LocationEvent[];

export interface MotionEvent extends GenericEvent {
  isMoving: boolean;
}

export enum ModeType {
  'BICYCLE' = 'BICYCLE',
  'ON_FOOT' = 'ON_FOOT',
  'RUNNING' = 'RUNNING',
  'STILL' = 'STILL',
  'VEHICLE' = 'VEHICLE',
}

export interface ModeChangeEvent extends GenericEvent {
  mode: ModeType;
  confidence: number;
}

export enum PathType {
  'CURRENT' = 'CURRENT',
  'DEFAULT' = 'DEFAULT',
}

export interface PathSegment {
  coordinates: LonLat[];
}

export interface Path {
  segments: PathSegment[],
  type?: PathType;
}

export interface TickEvent extends GenericEvent {
  // nothing more for now
}

const locEventFilter: EventFilter = (event: GenericEvent) => (event.type === EventType.LOC);

const locations = {

  // Convert GPX POJO (previously converted from XML) to a set of events that can be imported into the app.
  eventsFromGPX: (gpx: any): LocationEvents => {
    const events: LocationEvents = [];
    gpx.trk.map(trk => {
      // const name = trk.name;
      trk.trkseg.map(trkseg => {
        const maxIndex = trkseg.trkpt.length - 1;
        log.debug(`importing ${maxIndex + 1} locations`);

        trkseg.trkpt.map((trkpt, index) => {
          const pt = trkpt.$;
          const lat = pt.lat && parseFloat(pt.lat); // required
          const lon = pt.lon && parseFloat(pt.lon); // required
          const ele = (trkpt.ele && parseFloat(trkpt.ele[0])) || undefined;
          const time = (trkpt.time && trkpt.time[0]) || null; // UTC using ISO 8601
          const epoch = (new Date(time)).getTime(); // msec (epoch)

          // only log a sample of the locations to show progress
          if (!(index % 100) || index === maxIndex) { // TODO move this number to constants
            log.trace(`${index}/${maxIndex}: lat ${lat}, lon ${lon}, ele ${ele}, time ${time}, epoch ${epoch}`);
          }
          const event: LocationEvent = {
            ...timeseries.newEvent(epoch),
            type: EventType.LOC,
            ele,
            loc: [lon, lat],
            source: 'import', // TODO placeholder
          }
          events.push(event);
        }) // trkpt map
      }) // trkseg map
    }) // trk map
    return events;
  },

  // Return a single LOC event (or null if none found within the "near" threshold) nearest in time to given Timepoint t.
  locEventNearestTimepoint: (events: GenericEvents, t: Timepoint, near: number): (LocationEvent | null) => {
    const nearestMatches: LocationEvents =
      timeseries.findEventsNearestTimepoint(events, t, true, true, near, locEventFilter) as LocationEvents;

    if (!nearestMatches.length) {
      return null;
    } else {
      return nearestMatches[0]; // TODO this should be good enough
    }
  },

  pathFromEvents: (sourceEvents: GenericEvents, tr: TimeRange): Path => {
    let segments: PathSegment[] = [];
    let coordinates: LonLat[] = [];
    let previousLoc: LonLat | null = null;
    const events = timeseries.filterByTime(sourceEvents, tr);
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === EventType.LOC) {
        const locEvent = event as LocationEvent;
        const { loc } = locEvent;
        if (previousLoc) {
          const lineSegmentLength = distance(turf.point(loc), turf.point(previousLoc), { units: 'miles' });
          if (lineSegmentLength > sharedConstants.paths.maxLineSegmentInMiles) {
            log.debug('pathFromEvents lineSegmentLength', lineSegmentLength);
            // new path segment
            segments.push({ coordinates });
            coordinates = []; // reset
            previousLoc = null; // reset
          } else {
            coordinates.push(loc);
          }
        } else {
          coordinates.push(loc);
        }
        previousLoc = loc;
      }
    }
    if (coordinates.length) {
      segments.push({ coordinates });
    }
    return { segments };
  },
}

export default locations;
