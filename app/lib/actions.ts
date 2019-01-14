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
  'FOLLOW_USER' = 'FOLLOW_USER',
  'UNFOLLOW_USER' = 'UNFOLLOW_USER',
}

// These enum strings are preceded by async_ so as never to match any reducerActions (similar to namespacing)
export enum appAction {
  'GEOLOCATION' = 'async_GEOLOCATION',

  'CENTER_MAP_ON_USER' = 'async_CENTER_MAP_ON_USER',
  'USER_MOVED_MAP' = 'async_USER_MOVED_MAP',

  'START_FOLLOWING_USER' = 'async_START_FOLLOWING_USER',
  'STOP_FOLLOWING_USER' = 'async_STOP_FOLLOWING_USER',
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
// -- Dispatch that action (utils.dispatch) to Redux
// -- If it's a reducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions should act synchronously using pure functions without side effects.
// -- If it's an appAction, it should be handled by one of the sagas (and it just passes through the reducer)
//    appActions may yield other appActions and/or reducerActions.

// Note type could be an appAction or reducerAction.

export const newAction = (type: ActionType, params: any = null) => ({
  type,
  params,
})
