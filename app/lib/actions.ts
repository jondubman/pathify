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
  'CACHE' = 'CACHE',
  'GEOLOCATION' = 'GEOLOCATION',
  'MAP_REGION' = 'MAP_REGION', // tracks map region as it changes, whether user moved it or not
  'SET_APP_OPTION' = 'SET_APP_OPTION',
  'SET_REF' = 'SET_REF',
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
  'activityListReachedEnd' = 'activityListReachedEnd',
  'activityListScrolled' = 'activityListScrolled',
  'addEvents' = 'addEvents',
  'appStateChange' = 'appStateChange',
  'appQuery' = 'appQuery',
  'appStartupCompleted' = 'appStartupCompleted',
  'backgroundTapped' = 'backgroundTapped',
  'cache' = 'cache',
  'centerMap' = 'centerMap',
  'centerMapOnPath' = 'centerMapOnPath',
  'centerMapOnUser' = 'centerMapOnUser',
  'clearLogs' = 'clearLogs',
  'clearStorage' = 'clearStorage',
  'clockPress' = 'clockPress',
  'closePanels' = 'closePanels',
  'completeAppStartup' = 'completeAppStartup',
  'continueActivity' = 'continueActivity',
  'delayedAction' = 'delayedAction',
  'deleteActivity' = 'deleteActivity',
  'flagDisable' = 'flagDisable',
  'flagEnable' = 'flagEnable',
  'flagToggle' = 'flagToggle',
  'geolocation' = 'geolocation',
  'importEvents' = 'importEvents',
  'jumpToBackTime' = 'jumpToBackTime',
  'jumpToNow' = 'jumpToNow',
  'log' = 'log',
  'mapRegionChanged' = 'mapRegionChanged',
  'mapRegionChanging' = 'mapRegionChanging',
  'mapRendered' = 'mapRendered',
  'mapTapped' = 'mapTapped',
  'modeChange' = 'modeChange',
  'motionChange' = 'motionChange',
  'refreshActivity' = 'refreshActivity',
  'refreshActivityDone' = 'refreshActivityDone',
  'refreshAllActivities' = 'refreshAllActivities',
  'refreshCache' = 'refreshCache',
  'refreshCacheDone' = 'refreshCacheDone',
  'refreshCachedActivity' = 'refreshCachedActivity',
  'reorientMap' = 'reorientMap',
  'repeatedAction' = 'repeatedAction',
  'restartApp' = 'restartApp',
  'scrollTimeline' = 'scrollTimeline',
  'scrollActivityList' = 'scrollActivityList',
  'selectActivity' = 'selectActivity',
  'sequence' = 'sequence',
  'setAppOption' = 'setAppOption',
  'setAppOptionASAP' = 'setAppOptionASAP',
  'setRef' = 'setRef',
  'sleep' = 'sleep',
  'startActivity' = 'startActivity',
  'startFollowingPath' = 'startFollowingPath',
  'startFollowingUser' = 'startFollowingUser',
  'stopFollowing' = 'stopFollowing',
  'stopFollowingPath' = 'stopFollowingPath',
  'stopFollowingUser' = 'stopFollowingUser',
  'stoppedFollowing' = 'stoppedFollowing',
  'stoppedFollowingPath' = 'stoppedFollowingPath',
  'stoppedFollowingUser' = 'stoppedFollowingUser',
  'startupActions' = 'startupActions',
  'stopActivity' = 'stopActivity',
  'timelineZoomed' = 'timelineZoomed',
  'timelineZooming' = 'timelineZooming',
  'timerTick' = 'timerTick',
  'userMovedMap' = 'userMovedMap',
  'zoomToActivity' = 'zoomToActivity',
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
// -- Dispatch that action (store.dispatch) to Redux (note this looks different inside saga generators - use yield call)
// -- If it's a ReducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions must act synchronously using pure functions without side effects.
// -- If it's an AppAction, it should be handled by one of the sagas, after the action passes through the reducer.
//    (which generally takes no action with an AppAction, only ReducerActions.)
//    appActions may yield other appActions and/or reducerActions.

// This simple helper used throughout the app just forms an action with type and params properties.
// Note type could be an AppAction or ReducerAction.
export const newAction = (type: ActionType, params: any = null): Action => ({
  type,
  params,
})

// From here on: types related to params for actions

export enum AbsoluteRelativeOption {
  'absolute' = 'absolute',
  'relative' = 'relative',
}

import { LocationEvent, LonLat } from 'shared/locations';
import { AppStateChange } from 'shared/appEvents';
import { GenericEvents } from 'shared/timeseries';

export interface ActivityListScrolledParams {
  t: number;
}

export interface AddEventsParams {
  events: GenericEvents;
}

export interface AppStateChangeParams {
  newState: AppStateChange;
  manual?: boolean;
}

export interface CenterMapParams {
  center: LonLat;
  option: AbsoluteRelativeOption;
  zoom?: number;
}

export interface ClockPressParams {
  nowClock: boolean;
}

export interface ClosePanelsParams {
  option: string;
}

export interface ContinueActivityParams {
  activityId: string,
}

export interface DelayedActionParams {
  run: Action,
  after: number,
}

export interface DeleteActivityParams {
  id: string,
}

export interface GeolocationParams {
  locationEvent: LocationEvent;
  recheckMapBounds: boolean; // applies only when app is active
  t: number;
}

export interface ImportEventsParams {
  include: object; // TODO
}

export interface LogActionParams {
  level?: string; // TODO validate?
  message: string;
}

export interface RefreshActivityParams {
  id: string,
}

export interface RefreshCachedActivityParams {
  activityId: string;
  remove: boolean;
}

export interface RepeatedActionParams {
  repeat: Action,
  times: number,
}

export interface ScrollActivityListParams {
  scrollTime: number;
}

export interface ScrollTimelineParams {
  scrollTime: number;
}

export interface SelectActivityParams {
  id: string;
}

export type SequenceParams = Action[];

export interface SleepParams {
  for: number,
}

export interface StartActivityParams {
  continueActivityId?: string;
}

export interface UserMovedMapParams {
  center: LonLat;
}

export interface ZoomToActivityParams {
  id: string,
  zoomMap: boolean,
  zoomTimeline: boolean;
}
