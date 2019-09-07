// Redux action types are collected here, categorized into:
//
//   -- reducer actions
//      - synchronously handled by the reducer, directly impacting the Redux store
//
//   -- app actions
//      - should be handled by sagas (using redux-saga), which may trigger asynchronous activity,
//        and may dispatch reducer actions (via 'put' in redux-saga), indirectly impacting the Redux store.
//      - should not be handled by the reducer; let the saga dispatch any corresponding required ReducerAction.

// The actions are strings in order to work smoothly with redux-saga. This also makes action objects self-explanatory.
// There seems to be no way to avoid the repetition on each line given the syntax for TypeScript string enums.

export enum ReducerAction {
  'GEOLOCATION' = 'GEOLOCATION',
  'MAP_REGION' = 'MAP_REGION', // tracks map region as it changes, whether user moved it or not
  'TICK_EVENT' = 'TICK_EVENT', // corresponds to AppAction.tickEvent
  'SET_APP_OPTION' = 'SET_APP_OPTION',
  'SET_TIMER_TICK_INTERVAL' = 'SET_TIMER_TICK_INTERVAL', // note this is the actual JS interval, not the # of msec
  'FLAG_DISABLE' = 'FLAG_DISABLE',
  'FLAG_ENABLE' = 'FLAG_ENABLE',
  'FLAG_TOGGLE' = 'FLAG_TOGGLE',
}

// These enum strings are formatted in Pascal case so as never to match any reducerActions (similar to namespacing).
// While reducers are synchronous, these are handled asynchronously, via sagas.
// Each of these must correspond to a generator function in the sagas module with the same name.
// Some appActions and reducerActions have similar names (e.g. geolocation, GEOLOCATION).
// In these cases the AppAction is a wrapper that triggers the corresponding ReducerAction while handling side effects.
export enum AppAction {
  'addEvents' = 'addEvents',
  'appStateChange' = 'appStateChange',
  'appQuery' = 'appQuery', // see AppQueryParams
  'backgroundTapped' = 'backgroundTapped',
  'centerMap' = 'centerMap', // see CenterMapParams
  'centerMapOnUser' = 'centerMapOnUser',
  'clearStorage' = 'clearStorage',
  'clockPress' = 'clockPress',
  'continueActivity' = 'continueActivity',
  'delayedAction' = 'delayedAction', // see DelayedActionParams
  'flagDisable' = 'flagDisable',
  'flagEnable' = 'flagEnable',
  'flagToggle' = 'flagToggle',
  'geolocation' = 'geolocation',
  'importEvents' = 'importEvents',
  'importGPX' = 'importGPX',
  'log' = 'log', // see LogActionParams
  'mapRegionChanged' = 'mapRegionChanged',
  'mapRegionChanging' = 'mapRegionChanging',
  'mapTapped' = 'mapTapped',
  'menuItemSelected' = 'menuItemSelected',
  'modeChange' = 'modeChange',
  'motionChange' = 'motionChange',
  'panTimeline' = 'panTimeline', // see PanTimelineParams
  'tickEvent' = 'tickEvent',
  'reorientMap' = 'reorientMap',
  'repeatedAction' = 'repeatedAction', // see RepeatedActionParams
  'restartApp' = 'restartApp',
  'sequence' = 'sequence', // see SequenceParams
  'setAppOption' = 'setAppOption',
  'setPanelVisibility' = 'setPanelVisibility',
  'sleep' = 'sleep', // see SleepParams
  'sliderMoved' = 'sliderMoved',
  'startFollowingUser' = 'startFollowingUser',
  'stopFollowingUser' = 'stopFollowingUser',
  'startActivity' = 'startActivity',
  'startOrStopActivity' = 'startOrStopActivity',
  'stopActivity' = 'stopActivity',
  'timelineZoomed' = 'timelineZoomed',
  'timerTick' = 'timerTick',
  'userMovedMap' = 'userMovedMap',
}

export type ActionType = ReducerAction | AppAction;
export interface Action {
  type: ActionType;
  params: any;
}

// Generic Redux action creator.

// The simplest action creators are just a function that returns an action object, with a type, that can be
// passed to Redux dispatch.

// How actions flow:
// -- Something happens that should influence the Redux store, which is shared throughout the app.
//    This might be a location update from background geolocation, a user-initiated UI action, etc.
// -- Call an action creator, e.g. newAction
// -- Dispatch that action (store.dispatch) to Redux
// -- If it's a ReducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions should act synchronously using pure functions without side effects.
// -- If it's an AppAction, it should be handled by one of the sagas, after the action passes through the reducer.
//    (which may well take no action with it)
//    appActions may yield other appActions and/or reducerActions.

// This simple helper just forms an action with type and params properties.
// Note type could be an AppAction or ReducerAction.
export const newAction = (type: ActionType, params: any = null) => ({
  type,
  params,
})

// From here on: types related to params for actions

import { LocationEvents, LonLat } from 'shared/locations';
import { AppStateChange } from 'shared/appEvents';
import { GenericEvents, TimeReference } from 'shared/timeseries';
import { Activity } from 'shared/marks';

// TODO complete this list

export enum AbsoluteRelativeOption {
  'absolute' = 'absolute',
  'relative' = 'relative',
}

export interface AddEventsParams {
  events: GenericEvents;
}

export interface AppStateChangeParams {
  newState: AppStateChange;
}

export interface CenterMapParams {
  center: LonLat;
  option: AbsoluteRelativeOption;
  zoom?: number;
}

export interface ContinueActivityParams {
  activity: Activity,
}

export interface DelayedActionParams {
  run: Action,
  after: number,
}

export interface GeolocationParams {
  locationEvents: LocationEvents;
  recheckMapBounds: boolean;
}

export interface ImportEventsParams {
  include: object; // TODO
}

export interface ImportGPXParams {
  include: object;
  adjustStartTime?: TimeReference;
  adjustEndTime?: TimeReference;
}

export interface LogActionParams {
  level?: string; // TODO validate?
  message: string;
}

export interface PanTimelineParams {
  option: AbsoluteRelativeOption;
  t: number; // actually delta t, if option is relative
}

export interface RepeatedActionParams {
  repeat: Action,
  times: number,
}

export type SequenceParams = Action[];

export interface SleepParams {
  for: number,
}

export interface SliderMovedParams {
  name: string;
  value: number;
}

export interface StartActivityParams {
  continueActivity?: Activity;
}
