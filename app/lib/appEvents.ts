// appEvents here refer not to the location events, but to the app state changing from active to background etc.

import { GenericEvent } from 'lib/timeseries';

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
