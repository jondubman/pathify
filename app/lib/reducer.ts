import {
  appAction,
  newAction,
  reducerAction,
} from 'lib/actions';

import constants from 'lib/constants';
import { LocationEvent } from 'lib/geo';
import log from 'lib/log';

const initialAppState = {
  loc: null as any,
  options: {
    followingUser: true, // TODO
    keepMapCenteredWhenFollowing: true,
    mapStyle: constants.map.default.style,
  },
}

const Reducer = (state = initialAppState, action: any) => {
  const newState = { ...state }; // shallow copy for now

  switch (action.type) {
    // If there's an active trackingId, store location (associated with trackingId), and update track stats.
    // Note this will not post the location to the server. That happens in a Saga via queuePostLocation.
    case reducerAction.GEOLOCATION:
      const locationEvent: LocationEvent = action.params;
      if (locationEvent.lon && locationEvent.lat && locationEvent.time) {
        newState.loc = locationEvent;
      }
      break;

    case reducerAction.FOLLOW_USER:
      // TODO
      break;

    case reducerAction.UNFOLLOW_USER:
      // TODO
      break;

    default:
      // TODO could also validate it's a legitimate appAction
      if (!action.type.startsWith('@@redux/INIT') && !action.type.startsWith('appAction')) {
        log.warn('Unexpected action type in reducer:', action.type);
      }
  }
  return newState;
}

export default Reducer;
