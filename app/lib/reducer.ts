//  Redux reducer for the app

import { Feature } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import constants from 'lib/constants';
import { LocationEvent } from 'lib/geo';

// TODO
interface AppEvent {
  type: string;
  time: string;
}

// Canonical interface for AppOptions included in AppState.
// AppOptions are modifiable via the API by name. These include, but are not limited to,
// all the options that are modifiable via Settings in the UI.

export interface AppOptions {
  geolocationModeId: number;
  keepMapCenteredWhenFollowing: boolean;
  mapOpacity: number; // 0 to 1
  mapStyle: string;
}
const initialAppOptions: AppOptions = {
  geolocationModeId: 0,
  keepMapCenteredWhenFollowing: true,
  mapOpacity: 0.5,
  mapStyle: constants.map.default.style,
}
export interface AppOption {
  name: string;
  value: any;
}

// Canonical interface for AppUIState included in AppState.
// AppUIState is for transient, user-initiated state changes, e.g. for menus.

const initialAppUIState = {
  flags: {
    followingUser: true, // should map follow user?
    helpEnabled: false,
    mapFullScreen: false,
    mapMoving: false, // is the map currently moving? TODO not currently used
  },
  panels: {
    geolocation: { open: false },
    settings: { open: false },
  },
}
export type AppUIState = typeof initialAppUIState;

// Canonical interface for AppState, the contents of the Redux store

export interface AppState {
  loc?: LocationEvent;
  mapRegion: Feature | null;
  options: AppOptions;
  ui: AppUIState;
}

const initialAppState: AppState = {
  options: initialAppOptions,
  mapRegion: null,
  ui: initialAppUIState,
}

// The one and only Redux Reducer.

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
  const { params } = action;
  switch (action.type) {

    case reducerAction.GEOLOCATION:
      {
        const locationEvent = params as LocationEvent;
        if (locationEvent.lon && locationEvent.lat && locationEvent.time) {
          newState.loc = locationEvent;
        }
      }
      break;

    case reducerAction.MAP_REGION:
      {
        const mapRegion = params as Feature;
        newState.mapRegion = mapRegion;
      }
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

    case reducerAction.SET_APP_OPTION:
      {
        const { name, value } = params as AppOption;
        newState.options = {
          ...state.options,
          [name]: value,
        }
      }
      break;

    case reducerAction.SET_PANEL_VISIBILITY:
      {
        const panelName = params.name as string;
        const open = params.open as boolean;
        newState.ui = { ...state.ui };
        newState.ui.panels = { ...state.ui.panels };
        newState.ui.panels[panelName].open = open;
      }
      break;

    default:
      break;
  }
  return newState;
}

export default reducer;
