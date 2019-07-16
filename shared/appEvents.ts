import { GenericEvent } from './timeseries';

export enum AppStateChange {
  'STARTUP' = 'STARTUP',
  'ACTIVE' = 'ACTIVE',
  'BACKGROUND' = 'BACKGROUND',
  'INACTIVE' = 'INACTIVE',
}

export interface AppStateChangeEvent extends GenericEvent {
  data: {
    newState: AppStateChange;
  }
}
