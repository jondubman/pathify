import log from './log';
import { Activity } from './marks';
import timeseries, { EventType, GenericEvent, GenericEvents, Timepoint, TimeRange } from './timeseries';

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
    const index = timeseries.indexForPreviousTimepoint(events, t, true); // true: allowEqual. Start scanning backward.
    for (let i = index; i >= 0; i--) { // scan back from there
      const event = events[i];
      if (event.type === EventType.MARK) {
        const markEvent = event as MarkEvent;
        if (markEvent.data.subtype === MarkType.END) {
          if (markEvent.data.id) {
            previousEndEventIds.push(markEvent.data.id);
          }
        }
        if (markEvent.data.subtype === MarkType.START) {
          const startEvent = markEvent;
          const startId = startEvent.data.id || '';
          if (previousEndEventIds.indexOf(startId) === -1) { // not found
            // now seek a corresponding END
            const endEvents = timeseries.findNextEvents(events, t,
              (e: GenericEvent) => (
                e.type === EventType.MARK &&
                (e as MarkEvent).data.subtype === MarkType.END &&
                (e as MarkEvent).data.id === startId )
              )
            const endTime= endEvents.length ? endEvents[0].t : Infinity;
            const activity = {
              id: startId,
              tr: [startEvent.t, endTime],
            } as Activity;
            return activity;
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
