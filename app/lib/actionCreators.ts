import { appAction, reducerAction } from 'lib/actionTypes';
import utils from 'lib/utils';

// Redux action creators for the app.

// The simplest action creators are just a function that returns an action object, with a type, that can be
// passed to Redux dispatch.

// How actions flow:
// -- Something happens that should influence the Redux store, which is shared throughout the app.
//    This might be a location update from background geolocation, a user-initiated UI action, etc.
// -- Call an action creator, either a generic one like simpleAction, actionWithParams, or another below.
// -- Dispatch that action (utils.dispatch) to Redux
// -- If it's a reducerAction, it should be handled by one of the cases in the reducer.
//    reducerActions should act synchronously using pure functions without side effects.
// -- If it's an appAction, it should be handled by one of the sagas (and it just passes through the reducer)
//    appActions may yield other appActions and/or reducerActions.

// Note actionType could be an appAction or reducerAction.
const simpleAction = (actionType: string)  => ({
  type: actionType,
})

// Note actionType could be an appAction or reducerAction.
const actionWithParams = (actionType: string, params: any)  => ({
  type: actionType,
  params,
})

export {
  // basic action creators
  simpleAction,
  actionWithParams,
}
