// Shared code (client + server) having to do specifically with LocationEvents, ModeChangeEvents and MotionEvents.
export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];

import timeseries, {
  Events,
  EventFilter,
  EventType,
  GenericEvent,
  Timepoint,
} from './timeseries';

export interface LocationEvent extends GenericEvent {
  accuracy?: number; // meters
  battery?: number; // 0 to 1
  charging?: boolean; // is device plugged in
  confidence?: number; // see ModeChangeEvent
  ele?: number; // meters
  extra?: string; // for debugging
  heading?: number; // 0 <= degrees < 360
  lat: number;
  latIndexed: number; // int version of lat (times 1M)
  lon: number;
  lonIndexed: number; // int version of lon (times 1M)
  mode?: string; // see ModeChangeEvent
  odo?: number; // meters
  speed?: number; // mph (converted from meters per second)

  // properties derived from other events, but known at creation time of LocationEvent:
  gain?: number; // cumulative within activity TODO not implemented
  loss?: number; // cumulative within activity TODO not implemented
}

export type LocationEvents = LocationEvent[];

const locEventFilter: EventFilter = (event: GenericEvent) => (event.type === EventType.LOC);

// These are stored with Locations in Realm.
export enum ModeType {
  'BICYCLE' = 'BICYCLE',
  'ON_FOOT' = 'ON_FOOT',
  'RUNNING' = 'RUNNING',
  'STILL' = 'STILL',
  'UNKNOWN' = 'UNKNOWN',
  'VEHICLE' = 'VEHICLE',
}

// From enum to ordinal. The ordering of modes is (sort of) from slower to faster.
const modeToNumber = {
  [ModeType.UNKNOWN]: 0,
  [ModeType.STILL]: 1,
  [ModeType.ON_FOOT]: 2,
  [ModeType.RUNNING]: 3,
  [ModeType.BICYCLE]: 4,
  [ModeType.VEHICLE]: 5,
}

// From the ordinal, back to the enum...
const numberToModeType = (num: number) => ([
  [ModeType.UNKNOWN],
  [ModeType.STILL],
  [ModeType.ON_FOOT],
  [ModeType.RUNNING],
  [ModeType.BICYCLE],
  [ModeType.VEHICLE]
][Math.floor(num)])

// This is the human-readable version of mode displayed in ActivityDetails.
export const numberToModeText = (num: number) => ([
  'Unknown',
  'Still',
  'On Foot',
  'Running',
  'Bicycle',
  'Vehicle',
][Math.floor(num)])

export interface ModeChange {
  mode: ModeType;
  confidence: number;
}

export interface ModeChangeEvent extends GenericEvent, ModeChange { /* extending those two, adding no more */ }

// Note confidence is between 0 and 100, inclusive. So 100% confidence for running maps to the number 2.1.
export const modeChangeToNumber = (modeChange: ModeChange): number => (
  modeToNumber[modeChange.mode] + (modeChange.confidence / 1000)
)

export const numberToModeChange = (num: number): ModeChange => ({
  mode: numberToModeType[num],
  confidence: Math.round((num - Math.floor(num)) * 1000),
})

export interface MotionEvent extends GenericEvent {
  isMoving: boolean;
}

const locations = {

  // Convert GPX POJO (previously converted from XML) to a set of events that can be imported into the app.
  // TODO needs updating.
  // eventsFromGPX: (gpx: any): LocationEvents => {
  //   const events: LocationEvents = [];
  //   gpx.trk.map(trk => {
  //     trk.trkseg.map(trkseg => {
  //       const maxIndex = trkseg.trkpt.length - 1;
  //       log.debug(`importing ${maxIndex + 1} locations`);

  //       trkseg.trkpt.map((trkpt, index) => {
  //         const pt = trkpt.$;
  //         const lat = pt.lat && parseFloat(pt.lat); // required
  //         const lon = pt.lon && parseFloat(pt.lon); // required
  //         const ele = (trkpt.ele && parseFloat(trkpt.ele[0])) || undefined;
  //         const time = (trkpt.time && trkpt.time[0]) || null; // UTC using ISO 8601
  //         const epoch = (new Date(time)).getTime(); // msec (epoch)

  //         // only log a sample of the locations to show progress
  //         if (!(index % 100) || index === maxIndex) { // TODO move this number to constants
  //           log.trace(`${index}/${maxIndex}: lat ${lat}, lon ${lon}, ele ${ele}, time ${time}, epoch ${epoch}`);
  //         }
  //         const event: LocationEvent = {
  //           ...timeseries.newEvent(epoch),
  //           type: EventType.LOC,
  //           ele,
  //           lat,
  //           latIndexed: lat,
  //           lon,
  //           lonIndexed: lon,
  //           source: 'import', // TODO placeholder
  //         }
  //         events.push(event);
  //       }) // trkpt map
  //     }) // trkseg map
  //   }) // trk map
  //   return events;
  // },

  // Return a single LOC event (or null if none found within the "near" threshold) nearest in time to given Timepoint t.
  locEventNearestTimepoint: (events: Events, t: Timepoint, near: number): (LocationEvent | null) => {
    const nearestMatches: LocationEvents =
      timeseries.findEventsNearestTimepoint(events, t, true, true, near, locEventFilter) as LocationEvents;

    if (!nearestMatches.length) {
      return null;
    } else {
      return nearestMatches[0]; // TODO this should be good enough
    }
  },

  lonLat: (locationEvent: LocationEvent): LonLat => [locationEvent.lon, locationEvent.lat],
}

export default locations;
