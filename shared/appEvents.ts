import { GenericEvent, GenericEvents, Timepoint, EventType } from './timeseries';

export enum AppStateChange {
  'STARTUP' = 'STARTUP',
  'ACTIVE' = 'ACTIVE',
  'BACKGROUND' = 'BACKGROUND',
  'INACTIVE' = 'INACTIVE',
}

export interface AppStateChangeEvent extends GenericEvent {
  // type: EventType.APP;
  data: {
    newState: AppStateChange;
  }
}

export const lastStartupTime = (events: GenericEvents): (Timepoint | null) => {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type === EventType.APP) {
      if ((event as AppStateChangeEvent).data.newState === AppStateChange.STARTUP) {
        return event.t;
      }
    }
  }
  return null;
}

export enum AppUserAction {
  'START' = 'START',
  'STOP' = 'STOP',
}

export interface AppUserActionEvent extends GenericEvent {
  // type: EventType.UI;
  data: {
    userAction: AppUserAction,
  }
}
