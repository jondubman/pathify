// Shared code (client + server) having to do with time series of events.

// TODO may want to use turf.js

// Note classical for loops are used over a forEach / functional approach when iterating through a potentially large
// array of events, as this incurs less overhead for function closures and support break / continue.

// Define TimeRange tuple, which is always inclusive of its endpoints.
// Use 0 as the first number to indicate a range with no start (-Infinity is not needed as time is always positive.)
// Use Infinity as the second number to indicate a range with no end (open-ended time range).
export type Timepoint = number;
export type TimeRange = [Timepoint, Timepoint];

export enum EventType { // TODO keep in sync with datamodel.prisma
  'APP' = 'APP',
  'LOC' = 'LOC',
  'NONE' = 'NONE',
  'OTHER' = 'OTHER',
  'SYSTEM' = 'SYSTEM',
}

export interface GenericEvent {
  t: Timepoint;
  type: string;
  // subtype?: string;
  data?: object;
  source?: string; // generally either our own client ID, or something else if from server (like 'server')
                   // undefined for private/local events which do not get uploaded

  // used locally only (not committed to server):
  changed?: Timepoint; // timestamp if/when last changed. Used to identify events to sync with server.
}

// Functions of GenericEvents that return a single event can return an EventResult that contains both the index into
// GenericEvents as well as the actual event, for convenience.
// export interface EventResult {
//   event: GenericEvent;
//   index: number;
// }
export type EventFilter = (event: GenericEvent) => Boolean;
export type EventsFilter = (events: GenericEvent[], filter: EventFilter) => GenericEvent[];
export type GenericEvents = GenericEvent[];

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

  // Determine the number of events whose t is within the given TimeRange, with optional type filter
  countEvents: (events: GenericEvent[], tr: TimeRange = [0, Infinity], type: string = ''): number => {
    let count = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!type.length || type === event.type) {
        if (timeseries.timeInRange(event.t, tr)) {
          count++;
        }
      }
    }
    return count;
  },

  // filterEvents ia an EventsFilter
  filterEvents: (events: GenericEvent[], filter: EventFilter): GenericEvent[] => {
    return events.filter(filter);
  },

  // Return events whose t is within the given TimeRange, with optional type filter
  // TODO refactor to use filterEvents?
  // findEvents: (events: GenericEvent[], tr: TimeRange = [0, Infinity], type: string = ''): GenericEvent[] => {
  //   const results: GenericEvent[] = [];
  //   for (let i = 0; i < events.length; i++) {
  //     const event = events[i];
  //     if (!type.length || type === event.type) {
  //       if (timeseries.timeInRange(event.t, tr)) {
  //         results.push(event);
  //       }
  //     }
  //   }
  //   return results;
  // },

  findEventsAtTimepoint: (events: GenericEvent[], t: Timepoint): GenericEvent[] => {
    return timeseries.filterEvents(events, (event: GenericEvent) => {
      return event.t === t;
    })
  },

  // before: whether to consider events after Timepoint t (default true)
  // after: whether to consider events after Timepoint t (default true)
  // near: maximum time gap to consider "near" (default unrestricted)
  // eventFilter is optional.
  findEventsNearestTimepoint: (events: GenericEvent[], t: Timepoint,
                               before: Boolean = true, after: Boolean = true,
                               near: number = Infinity, eventFilter: EventFilter | null = null): GenericEvent[] => {
    let gap = Infinity;
    let results: GenericEvent[] = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (eventFilter && !eventFilter(event)) {
        continue;
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
  newEvent: (t: Timepoint): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      t: timestamp,
      // these are placeholders to be overridden
      type: 'NONE',
      data: {},
    }
  },

  // A synced event will be synchronized with the server (i.e. not private)
  // timestamped now unless a timestamp is provided.
  newSyncedEvent: (t: Timepoint): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      ...timeseries.newEvent(timestamp),
      changed: timeseries.uniqify(timestamp), // uniqifying it will facilitate filtering the event list by this value
      source: 'client', // TODO replace with client ID (a UUID) that will differ per app installation
    }
  },

  // Confirm that the given events are sorted by t, where t is non-negative.
  // TODO obtain performance benefit of sorted events by migrating to boolean search for timepoints where possible.
  // In practice this should not actually make a huge difference until there are a large number of events which should
  // take a long time when the event log basically consists of LOC updates (order of once per second) and user actions.
  sortedByTime: (events: GenericEvent[]): boolean => {
    let t = 0;
    for (let i = 0; i < events.length; i++) {
      const eventTime = events[i].t;
      if (eventTime < t) {
        return false;
      }
      t = eventTime;
    }
    return true;
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

  // When events are sorted by time, finding the total time range is easy.
  timeRangeOfEvents: (events: GenericEvent[]): TimeRange => {
    if (events.length < 1) {
      return [0, 0]; // no events passed in
    }
    return [events[0].t, events[events.length - 1].t];
  },

  // Make an integer timestamp (msec precision) 'unique' by adding a random number between 0 and 1 to it.
  // 'uniqified' timepoints make it easier to precisely filter discrete events from the global event list.
  // (Otherwise there might be multiple matches for a given timepoint.)
  // This approach is used to facilitate syncing of changed events, without messing with the canonical timepoint t.
  // TODO Think through implications in the unlikely event two random numbers ever match.
  uniqify: (t: Timepoint) => {
    return t + Math.random();
  },
}

export default timeseries;
