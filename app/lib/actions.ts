// Redux action types are collected here, categorized into:
//
//   -- app actions
//      - should not directly impact the Redux store
//      - should be handled by sagas (using redux-saga), which may trigger asynchronous activity,
//        and may generate reducer actions (via 'put' in redux-saga), indirectly impacting the Redux store.
//
//   -- reducer actions
//      - synchronously handled by the reducer, directly impacting the Redux store
//      - possibly observed post-facto by sagas for any downstream effects.

// This acts as an enum, essentially, so first
//   import { appAction, reducerAction } from 'actionTypes.js';
// and then use
//   appAction.START_TRACKING
// which will be set to a self-documenting action type string like this:
//   'appAction.START_TRACKING'

// Note it is permissible for appAction and reducerAction arrays below to have strings in common.
// e.g. appAction.TRACK_EVENT, reducerAction.TRACK_EVENT
//
// See https://stackoverflow.com/questions/34965856/what-is-the-point-of-the-constants-in-redux

const actionTypes = {} as any; // Keys (which are exported) will be the same as keys of actionTypeStrings.

const actionTypeStrings = { // Basis for forming the actionTypes.

  // actions initiated by the user or app, handled by sagas that may subsequently trigger cascading actions.
  // appAction are not handled by the reducer, but the reducer is usually invoked indirectly.
  appAction: [
    'GEOLOCATION',

    'CENTER_MAP_ON_USER',
    'USER_PANNED_MAP',

    'START_FOLLOWING_USER',
    'STOP_FOLLOWING_USER',
  ],

  // actions handled by the reducer. These directly impact the Redux store when dispatched.
  reducerAction: [
    'FOLLOW_USER',
    'UNFOLLOW_USER',

    'GEOLOCATION',
  ],
} as any;

for (const category of Object.keys(actionTypeStrings)) { // 'appAction', 'reducerAction'
  actionTypes[category] = {};
  for (let s of actionTypeStrings[category]) {
    actionTypes[category][s] = `${category}.${s}`;
    // This expands to, like:
    // actionTypes.appAction.START_TRACKING = 'appAction.START_TRACKING'
  }
}

const { appAction, reducerAction } = actionTypes;

// Redux action creators for the app.

// The simplest action creators are just a function that returns an action object, with a type, that can be
// passed to Redux dispatch.

// How actions flow:
// -- Something happens that should influence the Redux store, which is shared throughout the app.
//    This might be a location update from background geolocation, a user-initiated UI action, etc.
// -- Call an action creator, either a generic one like action, actionWithParams, or another below.
// -- Dispatch that action (utils.dispatch) to Redux
// -- If it's a reducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions should act synchronously using pure functions without side effects.
// -- If it's an appAction, it should be handled by one of the sagas (and it just passes through the reducer)
//    appActions may yield other appActions and/or reducerActions.

// Note actionType could be an appAction or reducerAction.

const newAction = (type: string, params: any = null) => ({
  type,
  params,
})

export { appAction, newAction, reducerAction };
