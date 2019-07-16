// Shared code (client + server) having to do specifically with location events and locations themselves.

export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];

import log from './log';
import timeseries, { EventFilter, EventType, GenericEvent, GenericEvents, Timepoint } from './timeseries';

export interface LocationEvent extends GenericEvent {
  data: {
    ele?: number;
    heading?: number;
    loc: LonLat;
    odo?: number;
    speed?: number;
    // TODO battery level?
  }
}

export type LocationEvents = LocationEvent[];

export interface MotionEvent extends GenericEvent {
  data: {
    isMoving: boolean;
  }
}

export enum ModeType {
  'VEHICLE' = 'VEHICLE',
  'BICYCLE' = 'BICYCLE',
  'ON_FOOT' = 'ON_FOOT',
  'RUNNING' = 'RUNNING',
  'STILL'   = 'STILL',
  'WALKING' = 'WALKING',
}

export interface ModeChangeEvent extends GenericEvent {
  data: {
    mode: ModeType;
    confidence: number;
  }
}

const locEventFilter: EventFilter = (event: GenericEvent) => (event.type == EventType.LOC);

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
          const ele = (trkpt.ele && parseFloat(trkpt.ele[0])) || null;
          const time = (trkpt.time && trkpt.time[0]) || null; // UTC using ISO 8601
          const epoch = (new Date(time)).getTime(); // msec (epoch)

          // only log a sample of the locations to show progress
          if (!(index % 100) || index == maxIndex) { // TODO move this number to constants
            log.trace(`${index}/${maxIndex}: lat ${lat}, lon ${lon}, ele ${ele}, time ${time}, epoch ${epoch}`);
          }
          const event: LocationEvent = {
            ...timeseries.newEvent(epoch),
            type: EventType.LOC,
            data: {
              ele,
              loc: [ lon, lat ],
            },
            source: 'import', // TODO placeholder
          }
          events.push(event);
        }) // trkpt map
      }) // trkseg map
    }) // trk map

  return events;
  },

  // Return a single LOC event (or null if none found within the "near" threshold) nearest in time to given Timepoint t.
  locEventNearestTimepoint: (events: GenericEvents, t: Timepoint, near: number): (LocationEvent | null)  => {

    const nearestMatches: LocationEvents =
      timeseries.findEventsNearestTimepoint(events, t, true, true, near, locEventFilter) as LocationEvents;

    if (!nearestMatches.length) {
      return null;
    } else {
      return nearestMatches[0]; // TODO this should be good enough
    }
  },
}

export default locations;
