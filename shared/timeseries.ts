// Note this module is shared between client and server.

// TODO may want to use turf.js

// Note classical for loops are used over a forEach / functional approach when iterating through a potentially large
// array of events, as this incurs less overhead for function closures and it's easier to break / continue.

// TimeRange tuple, which is always inclusive of its endpoints.
// Use 0 as the first number to indicate a range with no start (-Infinity is not needed as time is always positive.)
// Use Infinity as the second number to indicate a range with no end (open-ended time range).
export type TimeRange = [number, number];

// A "Track" is derived metadata about events. A Track does not include or contain any of the events themselves.
// It specifies a TimeRange for LOC updates, typically continuous in time and (thus) contiguous in location as well.
// TODO Could calculate Tracks and then check that the sum of the counts of each Track equals the count of LOC updates.
export interface Track { // singular
  tr: TimeRange;
  count: number; // count of LOC updates within that TimeRange, inclusive of endpoints (other event types not counted)
  // TODO distance? power used? max time/distance gap? Index of first or last event in the range? etc.
  // These are things that could be calculated post facto...
}

export type Tracks = Track[]; // plural

export interface GenericEvent {
  t: number;
  type: string;
  // subtype?: string;
  data?: object;
  source?: string; // generally either our own client ID, or something else if from server (like 'server')
                   // undefined for private/local events which do not get uploaded

  // used locally only (not committed to server):
  changed?: number; // timestamp if/when last changed. Used to identify events to sync with server.
}

export interface LocationEvent extends GenericEvent {
  data: {
    ele?: number;
    heading?: number;
    lat: number;
    lon: number;
    odo?: number;
    speed?: number;
    // TODO battery level?
  }
}

const timeseries = {

  // Continuous tracks are series of TimeRanges such that there is no time gap > maxTimeGap between LOC updates.
  // maxTimeGap is a threshold, in msec (like the other time quantities). Increasing this may decrease the # of tracks.
  //
  // Optional TimeRange tr filters the events to evaluate. Events outside that range are ignored.
  // Tracks are thus constrained to the TimeRange even if a session started before and/or continues after the TimeRange.
  //
  // It's possible there could be only one LOC update in a track (a valid track with no length), but never 0 LOCs.
  //
  // TODO *Contiguous* tracks, which add the requirement that consecutive LOC updates be in close proximity.
  //
  continuousTracks: (events: GenericEvent[], maxTimeGap: number, tr: TimeRange = [0, Infinity]): Tracks => {
    let tracks: Tracks = []; // to return
    let count = 0; // count of LOC updates per track
    let t_trackStart = 0; // timestamp of the start of the current track. 0 means no current track.
    let t_prevLocUpdate = 0; // timestamp of previous LOC update in a track that has been started. 0 means none yet.

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.t < tr[0]) {
        continue; // have yet to reach the TimeRange of interest
      }
      if (event.t > tr[1]) {
         // passed the end of the TimeRange
         if (t_trackStart) { // if there is a current track, complete it
          const t_trackEnd = t_prevLocUpdate; // t_prevLocUpdate will be nonzero if t_trackStart is nonzero.
          tracks.push({ tr: [t_trackStart, t_trackEnd], count });
          return tracks; // Done
        }
        break;
      }
      // Event is in the proper TimeRange. Is it close enough in time to the previous event to be included in the track?
      if (event.t - t_prevLocUpdate > maxTimeGap) {
        // Gap exceeds maxTimeGap
        const t_trackEnd = t_prevLocUpdate;
        if (count) {
          tracks.push({ tr: [t_trackStart, t_trackEnd], count });
          count = 0; // reset
        }
        t_trackStart = 0; // reset
        t_prevLocUpdate = 0; // reset
      }
      if (!t_prevLocUpdate || event.t - t_prevLocUpdate <= maxTimeGap) {
        if (event.type === 'LOC') { // This is the only place the event type is checked.
          // found a LOC event not just within the TimeRange, but within maxTimeGap
          count++; // This is the only place count is incremented. Only LOC events are counted.
          t_prevLocUpdate = event.t; // This is the only place this is set to nonzero.
          if (!t_trackStart) { // If a track wasn't started before, it is now.
            t_trackStart = event.t; // This is the only place this is set to nonzero.
          }
        } // else continue. Ignore non-LOC events within the TimeRange.
      }
    }
    // Done with all the events. But maybe not done making tracks. If a track is started (which implies not ended),
    // we must not have passed the end of the TimeRange (where t_trackStart is zeroed), so we have an open-ended track.
    if (t_trackStart && t_prevLocUpdate) {
      // complete the current track
      // TODO could note which tracks are open-ended... does it matter?
      tracks.push({ tr: [t_trackStart, t_prevLocUpdate], count });
    }
    return tracks;
  },

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

  // Return events whose t is within the given TimeRange, with optional type filter
  findEvents: (events: GenericEvent[], tr: TimeRange = [0, Infinity], type: string = ''): GenericEvent[] => {
    const results: GenericEvent[] = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!type.length || type === event.type) {
        if (timeseries.timeInRange(event.t, tr)) {
          results.push(event);
        }
      }
    }
    return results;
  },

  // local/private by default (i.e. not synced with the server)
  // timestamped now unless a timestamp is provided.
  newEvent: (t: number): GenericEvent => {
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
  newSyncedEvent: (t: number): GenericEvent => {
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

  // helper function to round time t down to the nearest minute, hour, etc. (determined by second parameter)
  timeRoundDown: (t: number, toNearest: number): number => {
    return t - (t % toNearest);
  },

  // helper function to round time t up to the nearest minute, hour, etc. (determined by second parameter)
  timeRoundUp: (t: number, toNearest: number): number => {
    return t - (t % toNearest) + toNearest;
  },

  // simple helper function to improve readability
  timeInRange: (t: number, tr: TimeRange): boolean => {
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
  uniqify: (t: number) => {
    return t + Math.random();
  },
}

export default timeseries;
