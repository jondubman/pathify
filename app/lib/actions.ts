// Redux action types are collected here, categorized into:
//
//   -- reducer actions
//      - synchronously handled by the reducer, directly impacting the Redux store
//      - possibly observed post-facto by sagas for any downstream effects.
//
//   -- app actions
//      - should be handled by sagas (using redux-saga), which may trigger asynchronous activity,
//        and may dispatch reducer actions (via 'put' in redux-saga), indirectly impacting the Redux store.
//      - should not directly impact the Redux store; let the saga dispatch any corresponding required reducerAction.

// The actions are strings in order to work smoothly with redux-saga. This also makes action objects self-explanatory.

export enum reducerAction {
  'GEOLOCATION' = 'GEOLOCATION',
  'MAP_REGION' = 'MAP_REGION', // tracks map region as it changes, whether user moved it or not
  'SET_APP_OPTION' = 'SET_APP_OPTION',
  'SET_PANEL_VISIBILITY' = 'SET_PANEL_VISIBILITY',
  'SET_TIMER_TICK_INTERVAL' = 'SET_TIMER_TICK_INTERVAL', // note this is the actual JS interval, not the # of msec
  'SERVER_SYNC_COMPLETED' = 'SERVER_SYNC_COMPLETED',
  'UI_FLAG_DISABLE' = 'UI_FLAG_DISABLE',
  'UI_FLAG_ENABLE' = 'UI_FLAG_ENABLE',
  'UI_FLAG_TOGGLE' = 'UI_FLAG_TOGGLE',
}

// These enum strings are formatted in Pascal case so as never to match any reducerActions (similar to namespacing).
// While reducers are synchronous, these are handled asynchronously (via sagas).
export enum appAction {
  'backgroundTapped' = 'backgroundTapped',
  'geolocation' = 'geolocation',
  'centerMapOnUser' = 'centerMapOnUser',
  'userMovedMap' = 'userMovedMap',
  'reorientMap' = 'reorientMap',
  'mapRegionChanged' = 'mapRegionChanged',
  'mapRegionChanging' = 'mapRegionChanging',
  'mapTapped' = 'mapTapped',
  'serverSync' = 'serverSync',
  'setAppOption' = 'setAppOption', // allows for side effects
  'setGeolocationMode' = 'setGeolocationMode',
  'startFollowingUser' = 'startFollowingUser',
  'stopFollowingUser' = 'stopFollowingUser',
  'timelineZoomed' = 'timelineZoomed',
  'timerTick' = 'timerTick',
  'togglePanelVisibility' = 'togglePanelVisibility',
}

export type ActionType = reducerAction | appAction;
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
// -- If it's a reducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions should act synchronously using pure functions without side effects.
// -- If it's an appAction, it should be handled by one of the sagas (and it just passes through the reducer)
//    appActions may yield other appActions and/or reducerActions.

// This simple helper just forms an action with type and params properties.
// Note type could be an appAction or reducerAction.
export const newAction = (type: ActionType, params: any = null) => ({
  type,
  params,
})
