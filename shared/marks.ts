import log from './log';
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

export const containingActivity = (events: GenericEvents, t: Timepoint): Activity | null => {
  try {
    const previousEndEventIds: string[] = [];
    log.debug('containingActivity', t);
    const index = timeseries.indexForPreviousTimepoint(events, t, true); // true: allowEqual. Start scanning backward.
    for (let i = index; i >= 0; i--) { // scan back from there
      log.debug('containingActivity i', i);
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
          log.debug('containingActivity found startEvent at', startEvent.t, startId, previousEndEventIds);
          if (previousEndEventIds.indexOf(startId) === -1) { // not found
            // now seek a corresponding END
            const endEvent = timeseries.findNextEvents(events, t,
              (e: GenericEvent) => (
                e.type === EventType.MARK &&
                (e as MarkEvent).data.subtype === MarkType.END &&
                (e as MarkEvent).data.id === startId )
              )[0]

            if (endEvent) {
              const activity = {
                id: startId,
                tr: [startEvent.t, endEvent.t],
              } as Activity;
              log.debug('containingActivity found endEvent, returning', activity);
              return activity;
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