//  Redux reducer for the app

import { Feature } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import constants from 'lib/constants';
import { LocationEvent } from 'lib/geo';
import AppUI from "components/presenters/AppUI";
import { treemapBinary } from "d3";

interface AppEvent {
  type: string;
  time: string;
}

// Canonical interface for AppOptions included in AppState.
// AppOptions are modifiable via the API by name. These include, but are not limited to,
// all the options that are modifiable via Settings in the UI.

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

// Canonical interface for AppUIState included in AppState.
// AppUIState is for transient, user-initiated state changes, e.g. for menus.

const initialAppUIState = {
  flags: {
    gpsControlShowing: false,
    helpEnabled: false,
    settingsOpen: false,
  },
}
type AppUIState = typeof initialAppUIState;

// Canonical interface for AppState, the contents of the Redux store

export interface AppState {
  loc?: LocationEvent;
  mapMoving: boolean;
  mapRegion: Feature | null;
  options: AppOptions;
  ui: AppUIState;
}

const initialAppState: AppState = {
  options: initialAppOptions,
  mapMoving: false,
  mapRegion: null,
  ui: initialAppUIState,
}

const setUIFlag = (flagName: string, newValue: boolean): void => {
}

// The one and only Redux Reducer.

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
  const { params } = action;
  switch (action.type) {

    case reducerAction.GEOLOCATION:
      const locationEvent = params as LocationEvent;
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
      newState.mapMoving = params as boolean;
      break;

    case reducerAction.MAP_REGION:
      const mapRegion = params as Feature;
      newState.mapRegion = mapRegion;
      break;

    case reducerAction.UI_FLAG_DISABLE:
      {
        const flagName = params as string;
        newState.ui = { ...state.ui };
        newState.ui.flags = { ...state.ui.flags };
        newState.ui.flags[flagName] = false;
      }
      break;

    case reducerAction.UI_FLAG_ENABLE:
      {
        const flagName = params as string;
        newState.ui = { ...state.ui };
        newState.ui.flags = { ...state.ui.flags };
        newState.ui.flags[flagName] = true;
      }
      break;

    case reducerAction.UI_FLAG_TOGGLE:
      {
        const flagName = params as string;
        newState.ui = { ...state.ui };
        newState.ui.flags = { ...state.ui.flags };
        newState.ui.flags[flagName] = !state.ui.flags[flagName];
      }
      break;

    default:
      break;
  }
  return newState;
}

export default reducer;
