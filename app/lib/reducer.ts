//  Redux reducer for the app

import { Feature } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import constants from 'lib/constants';
import { LocationEvent } from 'lib/geo';

interface AppEvent {
  type: string;
  time: string;
}

// Canonical interface for AppOptions included in AppState

export interface AppOptions {
  followingUser: boolean;
  keepMapCenteredWhenFollowing: boolean;
  mapStyle: string;
}
const initialAppOptions: AppOptions = {
  followingUser: true,
  keepMapCenteredWhenFollowing: true,
  mapStyle: constants.map.default.style,
}

// Canonical interface for AppState, the contents of the Redux store

export interface AppState {
  loc?: LocationEvent;
  mapMoving: boolean;
  mapRegion: Feature | null;
  options: AppOptions;
}

const initialAppState: AppState = {
  options: initialAppOptions,
  mapMoving: false,
  mapRegion: null,
}

// The one and only Redux Reducer.

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
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

    case reducerAction.MAP_MOVING:
      newState.mapMoving = action.params as boolean;
      break;

    case reducerAction.MAP_REGION:
      const mapRegion = action.params as Feature;
      newState.mapRegion = mapRegion;
      break;

    default:
      break;
  }
  return newState;
}

export default reducer;
