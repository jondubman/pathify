import log from './log';
import { Activity } from './marks';
import sharedConstants from './sharedConstants';
import timeseries, {
  Events,
  EventType,
  GenericEvent,
  GenericEvents,
  Timepoint,
  TimeRange
} from './timeseries';

export enum MarkType {
  'NONE' = 'NONE',
  'START' = 'START',
  'END' = 'END',
}

export interface MarkEvent extends GenericEvent {
  // type: EventType.MARK;
  subtype: MarkType;
  synthetic?: boolean;
}
export type MarkEvents = MarkEvent[];

export const markList = (events: Events): MarkEvents => {
  const marks: MarkEvents = [];
  for (let e of events.filtered('type == "MARK"')) {
    marks.push(e as any as MarkEvent);
  }
  return marks;
}

export interface Activity {
  id?: string;
  tr: TimeRange;
}
export type Activites = Activity[];

// Given events and a timepoint t, containingActivities are those with a START <= t and an END >= t. To obtain these:
// Filter events to include only marks (including START/END). Iterate through results, accumulating START markers with
// timepoint < t. An END mark with an id previously seen removes START marker from the list.
// Past timepoint t, any END mark with id previously seen adds an activity to a list of containingActivities.

export const containingActivities = (events: Events, t: Timepoint): Activites | null => {
  try {
    let activities: Activites = [];
    let startMarks: MarkEvents = [];
    const markEvents = events.filtered('type == "MARK"');
    for (let e of markEvents) {
      const markEvent = e as any as MarkEvent;
      if (!markEvent.activityId) {
        continue;
      }
      if (markEvent.t <= t) { // note <= to handle edge case of START marker right at t
        if (markEvent.subtype === MarkType.START) {
          startMarks.push(markEvent);
        }
      }
      if (markEvent.t < t) { // note strict <
        if (markEvent.subtype === MarkType.END) {
          if (markEvent.activityId) {
            startMarks = startMarks.filter((e: MarkEvent) => e.activityId !== markEvent.activityId);
          }
        }
      } else { // By timepoint t we no longer care about START marks, or END marks with unfamiliar ids.
        if (markEvent.subtype === MarkType.END) {
          const startMark = startMarks.find((e: MarkEvent) => e.activityId === markEvent.activityId);
          if (startMark) {
            // This is an END mark with an activityId previously seen.
            const activity: Activity = {
              id: startMark.activityId,
              tr: [startMark.t, markEvent.t],
            }
            activities.push(activity);
          }
        }
      }
    }
    return activities;
  } catch (err) {
    log.error('containingActivities', err);
    return [];
  }
}

// Given events and a timepoint t, 'the' containingActivity (singular) is defined as the most recently started activity
// whose endpoint is greater than t. To obtain this, we get all the containingActivities, then sort by endpoint and
// choose the first.
export const containingActivity = (events: Events, t: Timepoint): Activity | null => {
  try {
    // note null endpoint is treated as timestamp of Infinity for purposes of comparison
    const comparingEndpoints = (a: Activity, b: Activity) => (a.tr[1] || Infinity) > (b.tr[1] || Infinity) ? 1 : -1;
    const activities = containingActivities(events, t);
    if (!activities || !activities.length) {
      return null;
    }
    return activities.sort(comparingEndpoints)[0];
  } catch(err) {
    log.error('containingActivity', err);
    return null;
  }
}

export const insertMissingStopMarks = (events: GenericEvents): GenericEvents => { // TODO-Realm postpone
  log.trace('insertMissingStopMarks');
  try {
    // first pass: collect all the END marks
    const endEventIds: string[] = [];
    const startEventIds: string[] = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === EventType.MARK) {
        const markEvent = event as MarkEvent;
        if (markEvent.activityId) {
          if (markEvent.subtype === MarkType.START) {
            startEventIds.push(markEvent.activityId);
          }
          if (markEvent.subtype === MarkType.END) {
            endEventIds.push(markEvent.activityId);
          }
        }
      }
    }
    log.trace('insertMissingStopMarks: count of START marks', startEventIds.length);
    log.trace('insertMissingStopMarks: count of END marks', endEventIds.length);
    // second pass: for each START mark, if corresponding END mark is missing,
    // insert one at the start of any sufficiently large gap in the event stream.
    const syntheticEndMarks: MarkEvents = [];
    for (let j = 0; j < events.length; j++) {
      const event = events[j];
      if (event.type === EventType.MARK) {
        const markEvent = event as MarkEvent;
        if (markEvent.subtype === MarkType.START) {
          if (markEvent.activityId && endEventIds.indexOf(markEvent.activityId) < 0) {
            let priorLocationEventTime = event.t;
            const startId = markEvent.activityId;
            const threshold = sharedConstants.containingActivityTimeThreshold;
            for (let k = j + 1; k < events.length; k++) {
              const e = events[k];
              if (e.type === EventType.LOC) {
                const gap = e.t - priorLocationEventTime
                if (gap > threshold) {
                  log.trace('insertMissingStopMarks: gap', gap);
                  break;
                }
                priorLocationEventTime = e.t;
              }
            }
            const endMark: MarkEvent = {
              ...timeseries.newSyncedEvent(priorLocationEventTime),
              activityId: startId,
              type: EventType.MARK,
              subtype: MarkType.END,
              synthetic: true,
            }
            log.debug('insertMissingStopMarks: adding', endMark);
            syntheticEndMarks.push(endMark);
          }
        }
      }
    } // end of second pass
    events.push(...syntheticEndMarks);
  } catch(err) {
    log.error('insertMissingStopMarks', err);
  } finally {
    return events;
  }
}
