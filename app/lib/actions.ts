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
  'UI_FLAG_DISABLE' = 'UI_FLAG_DISABLE',
  'UI_FLAG_ENABLE' = 'UI_FLAG_ENABLE',
  'UI_FLAG_TOGGLE' = 'UI_FLAG_TOGGLE',
}

// These enum strings are preceded by async_ so as never to match any reducerActions (similar to namespacing).
// async_ serves as a reminder that while reducers are synchronous, these are handled asynchronously (via sagas).
export enum appAction {
  'BACKGROUND_TAPPED' = 'async_BACKGROUND_TAPPED',
  'GEOLOCATION' = 'async_GEOLOCATION',
  'CENTER_MAP_ON_USER' = 'async_CENTER_MAP_ON_USER',
  'USER_MOVED_MAP' = 'async_USER_MOVED_MAP',
  'REORIENT_MAP' = 'async_REORIENT_MAP',
  'MAP_REGION_CHANGED' = 'async_MAP_REGION_CHANGED',
  'MAP_REGION_CHANGING' = 'async_MAP_REGION_CHANGING',
  'MAP_TAPPED' = 'async_MAP_TAPPED',
  'SET_APP_OPTION' = 'async_SET_APP_OPTION', // Use appAction.SET_APP_OPTION to allow for side effects
  'SET_GEOLOCATION_MODE' = 'async_SET_GEOLOCATION_MODE',
  'START_FOLLOWING_USER' = 'async_START_FOLLOWING_USER',
  'STOP_FOLLOWING_USER' = 'async_STOP_FOLLOWING_USER',
  'TIMELINE_ZOOMED' = 'async_TIMELINE_ZOOMED',
  'TIMER_TICK' = 'async_TIMER_TICK',
  'TOGGLE_PANEL_VISIBILITY' = 'async_TOGGLE_PANEL_VISIBILITY',
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

// Note type could be an appAction or reducerAction.

export const newAction = (type: ActionType, params: any = null) => ({
  type,
  params,
})
