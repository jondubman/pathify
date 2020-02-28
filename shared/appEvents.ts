import { GenericEvent } from './timeseries';

export enum AppStateChange {
  'NONE' = 'NONE',
  'STARTUP' = 'STARTUP',
  'ACTIVE' = 'ACTIVE',
  'BACKGROUND' = 'BACKGROUND',
  'INACTIVE' = 'INACTIVE',
}

export interface AppStateChangeEvent extends GenericEvent {
  newState: AppStateChange;
}

export enum AppUserAction {
  'START' = 'START',
  'STOP' = 'STOP',
}

export interface AppUserActionEvent extends GenericEvent {
  userAction: AppUserAction,
}
