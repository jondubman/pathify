import {
  Action,
  reducerAction,
} from 'lib/actions';

import constants from 'lib/constants';
import log from 'lib/log';
import { LocationEvent } from 'lib/geo';

export interface AppOptions {
  followingUser: boolean;
  keepMapCenteredWhenFollowing: boolean;
  mapStyle: string;
}

export interface AppState {
  loc: LocationEvent | null;
  options: AppOptions;
}

const initialAppState: AppState = {
  loc: null,
  options: {
    followingUser: true, // TODO
    keepMapCenteredWhenFollowing: true,
    mapStyle: constants.map.default.style,
  },
}

const Reducer = (state = initialAppState, action: Action) => {
  const newState = { ...state }; // shallow copy for now
;
  switch (action.type) {
    case reducerAction.GEOLOCATION:
      const locationEvent = action.params as LocationEvent;
      if (locationEvent.lon && locationEvent.lat && locationEvent.time) {
        newState.loc = locationEvent;
      }
      break;

    case reducerAction.FOLLOW_USER:
      newState.options.followingUser = true;
      break;

    case reducerAction.UNFOLLOW_USER:
      newState.options.followingUser = false;
      break;

    default:
      break;
  }
  return newState;
}

export default Reducer;
