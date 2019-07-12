// Shared code (client + server)

import log from './log';
import timeseries, { EventType, GenericEvents, TimeRange } from './timeseries';

// Define "Track", a type of derived metadata about events.
// A Track does not include or contain any of the events themselves. It specifies a TimeRange for LOC updates,
// typically continuous in time (so probably contiguous in location as well.)
export interface Track { // singular
  tr: TimeRange;
  count: number; // count of LOC updates within that TimeRange, inclusive of endpoints (other event types not counted)
  // TODO distance? power used? max time/distance gap? Index of first or last event in the range? etc.
  // These are things that could be calculated post facto...
}

export type Tracks = Track[]; // plural

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
export const continuousTracks = (events: GenericEvents, maxTimeGap: number, tr: TimeRange = [0, Infinity]): Tracks => {
  if (!timeseries.sortedByTime(events)) {
    log.warn('continuousTracks: events out of order');
  }
  let tracks: Tracks = []; // to return
  let count = 0; // count of LOC updates per track
  let t_trackStart = 0; // timestamp of the start of the current track. 0 means no current track.
  let t_prevLocUpdate = 0; // timestamp of previous LOC update in a track that has been started. 0 means none yet.

  // Loop through all events, once
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.t < tr[0]) {
      continue; // have yet to reach the TimeRange of interest. We'll get there fast.
    }
    if (event.t >= tr[1]) {
      // reached the end of the TimeRange
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
      if (event.type === EventType.LOC) { // This is the only place the event type is checked.
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
}
