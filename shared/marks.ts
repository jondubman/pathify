import log from './log';
import { Activity } from './marks';
import sharedConstants from './sharedConstants';
import timeseries, {
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
  data: {
    id?: string; // use matching id for corresponding START and END marks
    subtype: MarkType;
  }
}
export type MarkEvents = MarkEvent[];

export const markList = (events: GenericEvents): MarkEvents => {
  const marks: MarkEvents = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.type === EventType.MARK) {
      marks.push(event as MarkEvent);
    }
  }
  return marks;
}

export interface Activity {
  id?: string;
  tr: TimeRange;
}

// Given events and a timepoint t, the containingActivity is the most recently started activity
// whose endpoint is greater than t.
export const containingActivity = (events: GenericEvents, t: Timepoint): Activity | null => {
  try {
    const previousEndEventIds: string[] = [];
    const index = timeseries.indexForPreviousTimepoint(events, t, true); // true: allowEqual (as in <= rather than <)
    for (let i = index; i >= 0; i--) { // scan backward from there
      const event = events[i];
      if (event.type === EventType.MARK) {
        const markEvent = event as MarkEvent; // found a mark
        if (markEvent.data.subtype === MarkType.END) {
          if (markEvent.data.id) { // found an END mark
            previousEndEventIds.push(markEvent.data.id);
          }
        }
        if (markEvent.data.subtype === MarkType.START) {
          const startEvent = markEvent; // found a START mark
          const startId = startEvent.data.id || '';
          const startTime = startEvent.t;
          if (previousEndEventIds.indexOf(startId) === -1) { // if we haven't encountered END mark for this START mark
            // then seek the corresponding END (with matching mark id), scanning forward
            const endEvents = timeseries.findNextEvents(events, t,
              (e: GenericEvent) => (
                e.type === EventType.MARK &&
                (e as MarkEvent).data.subtype === MarkType.END &&
                (e as MarkEvent).data.id === startId )
              )
            if (endEvents.length) {
              const endTime = endEvents[0].t; // there should be only one (TODO assert)
              return {
                id: startId,
                tr: [startTime, endTime],
              } as Activity;
            } else {
              // No END event, which implies an an unfinished activity.
              // For the endTime, choose the timepoint of the last event in the sequence starting from startTime
              // such that there is no time gap between consecutive LocationEvents of greater than some threshold.
              let priorLocationEventTime: number = 0;
              for (let j = i; j < events.length; j++) {
                const event = events[j];
                const threshold = sharedConstants.containingActivityTimeThreshold;
                if (event.type === EventType.LOC) {
                  if (priorLocationEventTime && event.t - priorLocationEventTime > threshold) {
                    return {
                      id: startId,
                      tr: [startTime, priorLocationEventTime],
                    } as Activity;
                  }
                  priorLocationEventTime = event.t;
                }
              }
            }
          }
        }
      }
    }
    return null;
  } catch(err) {
    log.error('containingActivity', err);
    return null;
  }
}
