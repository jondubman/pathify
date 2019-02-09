//  Redux reducer for the app

import { Feature } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import { LocationEvent } from 'lib/geo'; // TODO update

import {
  initialAppState,
  AppOption,
  AppState,
} from 'lib/state';

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
