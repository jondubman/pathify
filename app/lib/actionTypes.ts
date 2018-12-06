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
  ],

  // actions handled by the reducer. These directly impact the Redux store when dispatched.
  reducerAction: [
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
export { appAction, reducerAction };
