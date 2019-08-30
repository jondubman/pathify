// Shared code (client + server) to support time series of events.

import log from './log';

// Note classical for loops are used over a forEach / functional approach when iterating through a potentially large
// array of events, as this incurs less overhead for function closures and support break / continue.

// TimeRange tuple is always inclusive of its endpoints.
// Use 0 as the first number to indicate a range with no start (-Infinity is not needed as time is always positive.)
// Use Infinity as the second number to indicate a range with no end (open-ended time range).
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
  'TICK' = 'TICK', // heartbeat-type event mainly for debugging
  'USER_ACTION' = 'USER_ACTION', // user action
}

export interface GenericEvent {
  t: Timepoint;
  type: EventType;
  source?: string; // generally either our own client ID, or something else if from server (like 'server')
                   // undefined for private/local events which do not get uploaded

  // used locally only (not committed to server):
  changed?: Timepoint; // timestamp if/when last changed. Used to identify events to sync with server.
  temp?: boolean; // true means do not persist anywhere
}

// Functions of GenericEvents that return a single event can return an EventResult that contains both the index into
// GenericEvents as well as the actual event, for convenience.
// export interface EventResult {
//   event: GenericEvent;
//   index: number;
// }
export type EventFilter = (event: GenericEvent) => Boolean; // true: event passes filter
export type EventsFilter = (events: GenericEvents, filter: EventFilter) => GenericEvents;
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

  // Adjust the Timepoints in a time series of events.
  // relativeTo is only needed if at least one of the TimeReferences is relative.
  adjustTime: (events: GenericEvents,
               startAt: TimeReference | null = null,
               endAt: TimeReference | null = null,
               relativeTo: Timepoint = 0): GenericEvents => {

    if (!events.length) {
      return [];
    }
    if (!startAt && !endAt) {
      return events; // no adjustments to make
    }
    const newEvents: GenericEvents = [];
    const existingStart = events[0].t;
    const existingEnd = events[events.length - 1].t;
    const existingDuration = existingEnd - existingStart;

    // relativeTo is typically set at runtime, whereas startAt / endAt are likely to be specified, e.g. in test samples.
    // relativeTo might be the current time, or perhaps the refTime of the timeline.

    let newStart = startAt ? (startAt.relative ? relativeTo + startAt.t : startAt.t) : existingStart;
    let newEnd =   endAt   ? (endAt.relative   ? relativeTo + endAt.t   : endAt.t)   : existingEnd;

    // timeScaleFactor is only needed if both startAt and endAt are specified; otherwise assumed to be 1 (no scaling)
    const timeScaleFactor = (startAt && endAt) ? (newEnd - newStart) / existingDuration : 1;

    // Now make the time adjustments
    for (let i = 0; i < events.length; i++) {
      const newEvent: GenericEvent = { ...events[i] };
      if (startAt) {
        newEvent.t = newStart + (newEvent.t - existingStart) * timeScaleFactor;
      } else { // endAt
        newEvent.t = newEnd - (existingEnd - newEvent.t) * timeScaleFactor;
      }
      newEvents.push(newEvent);
    }
    return newEvents;
  },

  // Determine the number of events whose t is within the given TimeRange, with optional type filter
  countEvents: (events: GenericEvents, tr: TimeRange = [0, Infinity], type: string = ''): number => {
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

  // TODO since events are sorted by time this could be done with a slice... can use binary search to determine indexes.
  filterByTime: (events: GenericEvents, tr: TimeRange = [0, Infinity]): GenericEvents => {
    return events.filter((e: GenericEvent) => (timeseries.timeInRange(e.t, tr)));
  },

  filterEvents: (events: GenericEvents, eventFilter: EventFilter): GenericEvents => {
    return events.filter(eventFilter);
  },

  findEventsAtTimepoint: (events: GenericEvents, t: Timepoint): GenericEvents => {
    return timeseries.filterEvents(events, (event: GenericEvent) => {
      return event.t === t;
    })
  },

  // before: whether to consider events after Timepoint t (default true)
  // after: whether to consider events after Timepoint t (default true)
  // near: maximum time gap to consider "near" (default unrestricted)
  // eventFilter is optional.
  findEventsNearestTimepoint: (events: GenericEvents, t: Timepoint,
                               before: Boolean = true, after: Boolean = true,
                               near: number = Infinity, eventFilter: EventFilter | null = null): GenericEvents => {
    let gap = Infinity;
    let results: GenericEvents = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
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

  // Given events, a timepoint and an eventFilter, find the immediately preceding event(s) matching the filter.
  // Note: Multiple matching events at the same timepoint will be returned. Filter is optional.
  // Use case: Given some reference timepoint, find the prior MARK event with a START subtype.
  findPreviousEvents: (events: GenericEvents, t: Timepoint,
                       eventFilter: EventFilter = null, all: boolean = false): GenericEvents => {
    const startingIndex = timeseries.indexForPreviousTimepoint(events, t);
    if (startingIndex < 0) {
      return [];
    }
    const previousEvents: GenericEvents = [];
    for (let i = startingIndex; i >= 0; i--) {
      const event = events[i];
      if (!all && previousEvents.length && event.t !== previousEvents[0].t) {
        break; // done accumulating events at the same timepoint
      }
      if (!eventFilter || eventFilter(event)) {
        previousEvents.push(event);
      }
    }
    return previousEvents;
  },

  // Given events, a timepoint and an eventFilter, find the immediately subsequent event(s) matching the filter.
  // Note: Multiple matching events at the same timepoint may be returned. Filter is optional.
  // Use case: Given some reference timepoint, find the subsequent MARK event with a END subtype.
  findNextEvents: (events: GenericEvents, t: Timepoint,
                   eventFilter: EventFilter = null, all: boolean = false): GenericEvents => {
    const startingIndex = timeseries.indexForNextTimepoint(events, t);
    if (startingIndex === events.length) {
      return [];
    }
    const nextEvents: GenericEvents = [];
    for (let i = startingIndex; i < events.length; i++) {
      const event = events[i];
      if (!all && nextEvents.length && event.t !== nextEvents[0].t) {
        break; // done accumulating events at the same timepoint
      }
      if (!eventFilter || eventFilter(event)) {
        nextEvents.push(event);
      }
    }
    return nextEvents;
  },

  // Given Timepoint t, return the smallest index into events such that events[index].t > t.
  // Return events.length if there are no events after t.
  // So given time series like [ 1, 2, 3, 4, 5 ], with events.length of 5:
  //     If t is 0.5, index is 0
  //     If t is 1, index is 0
  //     If t is 1.5, index is 1
  //     If t is 4.8, index is 4 (the index of the event with timepoint 5, the "next" timepoint)
  //     If t is 5, index is 5 (events.length)
  //     If t is 6, index is 5 (events.length) (same)
  // This is like "stepping forward" one timepoint.
  indexForNextTimepoint: (events: GenericEvents, t: Timepoint, allowEqual: boolean = false): (Timepoint | null) => {
    for (let index = 0; index < events.length; index++) { // scan from the start
      const eventTime = events[index].t;
      if (eventTime > t || (allowEqual && eventTime === t)) {
        return index;
      }
    }
    return events.length;
  },

  // Given Timepoint t, return the largest index into events such that events[index].t < t.
  // Return -1 if the given timepoint is prior to the events.
  // So given time series like [ 1, 2, 3, 4, 5 ], with events.length of 5:
  //     If t is 0.5, index is -1
  //     If t is 1, index is still -1, because of strict <
  //     If t is 1.5, index is 0
  //     If t is 4.8, index is 3 (the index of the event with timepoint 4, the "previous" timepoint)
  //     If t is 5, index is 2
  //     If t is 6, index is 3
  // This is like "stepping backward" one timepoint.
  indexForPreviousTimepoint: (events: GenericEvents, t: Timepoint, allowEqual: boolean = false): (Timepoint | null) => {
    for (let index = events.length - 1; index >=  0; index--) { // scan backwards from the end
      const eventTime = events[index].t;
      if (eventTime < t || (allowEqual && eventTime === t)) {
        return index;
      }
    }
    return -1;
  },

  mergeEvents: (listOne: GenericEvents, listTwo: GenericEvents): GenericEvents => {
    const mergedEvents = [ ...listOne, ...listTwo ].sort((a: GenericEvent, b: GenericEvent) => (a.t - b.t));
    return mergedEvents;
  },

  // local/private by default (i.e. not synced with the server)
  // timestamped now unless a timestamp is provided.
  newEvent: (t: Timepoint): GenericEvent => {
    const timestamp = t || Date.now(); // TODO maybe require t
    return {
      t: Math.round(timestamp), // TODO for now, avoid creating events with sub-millisecond precision timestamps
      // The following are placeholders, to be overridden:
      type: EventType.NONE,
    }
  },

  // A synced event will be synchronized with the server (i.e. not private)
  // timestamped now, unless a timestamp is provided.
  newSyncedEvent: (t: Timepoint): GenericEvent => {
    const timestamp = t || Date.now(); // TODO maybe require t
    return {
      ...timeseries.newEvent(timestamp),
      changed: timeseries.uniqify(timestamp), // uniqifying it will facilitate filtering the event list by this value
      source: 'client', // TODO replace with client ID (a UUID) that will differ per app installation
    }
  },

  // Return sorted events, or the original events if they were already sorted.
  // Sorting is an expensive operation but in practice the events will be close to sorted already.
  sortEvents: (events: GenericEvents): GenericEvents => {
    if (timeseries.sortedByTime(events)) {
      return events;
    }
    log.trace('sortEvents: sort required');
    const sortedEvents = [ ...events ].sort((a: GenericEvent, b: GenericEvent) => (a.t - b.t));
    if (!timeseries.sortedByTime(sortedEvents)) { // TODO avoid overhead of this call in production
      log.warn('sortEvents: sort failed');
    }
    return sortedEvents;
  },

  // Confirm that the given events are sorted by t, where t is non-negative.
  // TODO obtain performance benefit of sorted events by migrating to boolean search for timepoints where possible.
  // In practice this should not actually make a huge difference until there are a large number of events which should
  // take a long time when the event log basically consists of LOC updates (order of once per second) and user actions.
  sortedByTime: (events: GenericEvents): boolean => {
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

  // TODO
  countUnsorted: (events: GenericEvents): number => {
    let count = 0, t = 0;
    for (let i = 0; i < events.length; i++) {
      const eventTime = events[i].t;
      if (eventTime < t) {
        log.trace('countUnsorted', t, eventTime);
        count++;
      }
      t = eventTime;
    }
    return count;
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
  timeRangeOfEvents: (events: GenericEvents): TimeRange => {
    if (events.length < 1) {
      return [0, 0]; // no events passed in
    }
    return [events[0].t, events[events.length - 1].t];
  },

  timeRangesEqual: (tr1: TimeRange, tr2: TimeRange): boolean => (
    tr1[0] === tr2[0] && tr1[1] === tr2[1]
  ),

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
