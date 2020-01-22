import { Events, GenericEvent, Timepoint, EventType } from './timeseries';

export enum AppStateChange {
  'NONE' = 'NONE',
  'STARTUP' = 'STARTUP',
  'ACTIVE' = 'ACTIVE',
  'BACKGROUND' = 'BACKGROUND',
  'INACTIVE' = 'INACTIVE',
}

export interface AppStateChangeEvent extends GenericEvent {
  // type: EventType.APP;
  newState: AppStateChange;
}

export enum AppUserAction {
  // 'MENU_ITEM_SELECTED' = 'MENU_ITEM_SELECTED',
  'START' = 'START',
  'STOP' = 'STOP',
}

export interface AppUserActionEvent extends GenericEvent {
  // type: EventType.USER_ACTION;
  userAction: AppUserAction,
}
