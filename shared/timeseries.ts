// Shared code (client + server) to support time series of events.

import Realm from 'realm';

export type Events = Realm.Results<Realm.Object>;

// TimeRange tuple is always inclusive of its endpoints.
// Use 0 as the first number to indicate a range with no start (TODO is this actually valid?)
// Use 0 as the second number to indicate a range with no end (open-ended time range).
export type Timepoint = number;
export type TimeRange = [Timepoint, Timepoint];

export interface TimeReference { // relative or absolute
  t: Timepoint;
  relative: boolean;
}

export enum EventType { // TODO keep in sync with datamodel.prisma
  'APP' = 'APP', // see AppStateChange
  'LOC' = 'LOC', // geolocation result
  'MARK' = 'MARK', // timeline mark, whether user-defined or automatically placed
  'MODE' = 'MODE', // see ModeType
  'MOTION' = 'MOTION', // isMoving: true or false
  'NONE' = 'NONE', // placeholder when creating events
  'OTHER' = 'OTHER', // reserved for experimentation
  'SYSTEM' = 'SYSTEM', // reserved for future use
  'TEST' = 'TEST', // reserved for testing
  'USER_ACTION' = 'USER_ACTION', // user action
}

export const EventSchema: Realm.ObjectSchema = {
  name: 'Event',
  properties: {
    // GenericEvent
    activityId: { type: 'string?', indexed: true },
    index: 'int?',
    source: 'string?',
    t: { type: 'int', indexed: true }, // required
    // type is required. Based on this, there may be additional properties. All are said to be optional here for
    // the Realm scehema, but the corresponding TypeScript types clarify what is truly optional.
    type: { type: 'string', indexed: true },

    // AppStateChangeEvent
    newState: 'string?',

    // AppUserActionEvent
    userAction: 'string?',

    // LocationEvent - first the raw properties from geolocation:
    accuracy: 'int?',
    battery: 'float?',
    charging: 'bool?',
    ele: 'int?',
    extra: 'string?',
    heading: 'float?',
    lat: 'double?', // note: also indexing integer versions of these same coordinates
    lon: 'double?', // because you cannot index a float/double in Realm.
    latIndexed: { type: 'int?', indexed: true }, // lat times 1M, and rounded to an int
    lonIndexed: { type: 'int?', indexed: true }, // lon times 1M, and rounded to an int
    odo: 'float?',
    speed: 'float?',
    // + derived properties:
    gain: 'float?', // cumulative elevation gain within activity TODO not implemented
    loss: 'float?', // cumulative elevation gain within activity TODO not implemented

    // MarkEvent
    subtype: 'string?',
    synthetic: 'bool?',

    // MotionEvent
    isMoving: 'bool?',

    // ModeChangeEvent
    mode: 'string?',
    confidence: 'int?',
  }
}

export interface GenericEvent {
  activityId?: string; // use matching activityId for corresponding START and END marks and events collected between
  index?: number; // count of events starting from 1 recorded within an activity
  t: Timepoint;
  type: EventType;
  source?: string; // generally either our own client ID, or something else if from server (like 'server')
}

export type EventFilter = (event: GenericEvent) => Boolean; // true: event passes filter // TODO-Realm postpone
export type EventsFilter = (events: GenericEvents, filter: EventFilter) => GenericEvents; // TODO-Realm postpone
export type GenericEvents = GenericEvent[]; // An array, possibly temporary, not necessarily backed by Realm

export const interval = {
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,

  seconds: (n: number) => interval.second * n,
  minutes: (n: number) => interval.minute * n,
  hours: (n: number) => interval.hour * n,
  days: (n: number) => interval.day * n,
  weeks: (n: number) => interval.week * n,
}

const timeseries = {

  // Determine the number of events whose t is within the given TimeRange (inclusive!), with optional type filter
  countEvents: (events: Events, tr: TimeRange = [0, Infinity], type: string = ''): number => {
    if (type == '') {
      return events.filtered('t >= $0 AND t <= $1', tr[0], tr[1]).length;
    } else {
      return events.filtered('t >= $0 AND t <= $1 AND type = ', tr[0], tr[1], type).length;
    }
  },

  filterByTime: (events: Events, tr: TimeRange = [0, Infinity]): Events => {
    if (!tr[1] || tr[1] === Infinity) {
      return events.filtered(`t >= ${tr[0]}`);
    } else {
      return events.filtered(`t >= ${tr[0]} AND t <= ${tr[1] || Infinity}`);
    }
  },

  // before: whether to consider events after Timepoint t (default true)
  // after: whether to consider events after Timepoint t (default true)
  // near: maximum time gap to consider "near" (default unrestricted)
  // eventFilter is optional.
  findEventsNearestTimepoint: (events: Events, t: Timepoint,
    before: Boolean = true, after: Boolean = true,
    near: number = Infinity, eventFilter: EventFilter | null = null): GenericEvents => {
    let gap = Infinity;
    let results: GenericEvents = [];
    for (let e of events) {
      const event = e as any as GenericEvent;
      if (eventFilter && !eventFilter(event)) {
        continue; // ignore events rejected by the filter
      }
      if (event.t === t) {
        results.push(event);
        gap = 0;
        continue;
      }
      if (before && (event.t < t) && (t - event.t <= near) && (t - event.t <= gap)) {
        if (t - event.t === gap) {
          results.push(event);
        } else {
          results = [event]; // reset results
          gap = t - event.t; // reset gap
        }
        continue;
      }
      if (after && (t < event.t) && (event.t - t <= near) && (event.t - t <= gap)) {
        if (event.t - t === gap) {
          results.push(event);
        } else {
          results = [event]; // reset results
          gap = event.t - t; // reset gap
        }
      }
    }
    return results;
  },

  // local/private by default (i.e. not synced with the server)
  // timestamped now unless a timestamp is provided.
  newEvent: (t: Timepoint, activityId: string = null): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      activityId,
      t: Math.round(timestamp), // TODO for now, avoid creating events with sub-millisecond precision timestamps
      // The following are placeholders, to be overridden:
      type: EventType.NONE,
    }
  },

  // A synced event will be synchronized with the server (i.e. not private)
  // timestamped now, unless a timestamp is provided.
  newSyncedEvent: (t: Timepoint, activityId: string = null): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      ...timeseries.newEvent(timestamp, activityId),
      source: 'client', // TODO replace with client ID (a UUID) that will differ per app installation
    }
  },

  // helper function to round time t down to the previous minute, hour, etc. (determined by second parameter)
  // Example: timeRoundDown(t, 1000) would round down to the previous second boundary
  timeRoundDown: (t: Timepoint, toPrevious: number): number => {
    return t - (t % toPrevious);
  },

  timeRoundDownHours: (t: Timepoint): number => {
    return timeseries.timeRoundDown(t - (new Date(t).getHours() % 12) * interval.hour, interval.hour);
  },

  timeRoundDownToMidnight: (t: Timepoint): number => {
    return timeseries.timeRoundDown(t - (new Date(t).getHours()) * interval.hour, interval.hour);
  },

  // helper function to round time t up to the next minute, hour, etc. (determined by second parameter)
  // Example: timeRoundUp(t, 60000) would round up to the next minute boundary
  timeRoundUp: (t: Timepoint, toNext: number): number => {
    return t - (t % toNext) + toNext;
  },

  // simple helper function to improve readability
  timeInRange: (t: Timepoint, tr: TimeRange): boolean => {
    return (tr[0] <= t && t <= tr[1]);
  },

  // As events are sorted by time, determining the total time range is trivial.
  // timeRangeOfEvents: (events: Events): TimeRange => {
  //   if (events.length < 1) {
  //     return [0, 0]; // no events passed in
  //   }
  //   const firstEvent = events[0] as any as GenericEvent;
  //   const lastEvent = events[events.length - 1] as any as GenericEvent;
  //   return [firstEvent.t, lastEvent.t];
  // },

  timeRangesEqual: (tr1: TimeRange, tr2: TimeRange): boolean => (
    tr1[0] === tr2[0] && tr1[1] === tr2[1]
  ),
}

export default timeseries;
