import { EventType, GenericEvent, GenericEvents, TimeRange } from './timeseries';

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
