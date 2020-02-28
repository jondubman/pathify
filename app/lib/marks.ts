import {
  Events,
  GenericEvent,
} from 'lib/timeseries';

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
