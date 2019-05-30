//  Redux reducer for the app

import { Polygon } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import { GenericEvent, LocationEvent } from 'shared/timeseries'; // TODO update
import log from 'lib/log';

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
        if (locationEvent.data.lon && locationEvent.data.lat && locationEvent.t && locationEvent.type === 'LOC') {
          newState.loc = locationEvent;
          newState.events = [...newState.events, locationEvent];
          log.trace(`count of ${newState.events.length} total events`);
        }
      }
      break;

    case reducerAction.MAP_REGION:
      {
        const mapRegion = params as Polygon;
        newState.mapRegion = mapRegion;
      }
      break;

    case reducerAction.SERVER_SYNC_COMPLETED:
      {
        const timestamps = params as number[];
        const events = [ ...newState.events ];
        for (let i = 0; i < events.length; i++) {
          if (timestamps.includes(events[i].t)) {
            events[i].changed = 0; // This is where it is reset.
          }
        }
        newState.events = events;
        log.debug(`SERVER_SYNC_COMPLETED: ${timestamps.length} synced, ${events.length - timestamps.length} remaining`);
      }
      break;

    case reducerAction.SET_APP_OPTION: // no need for equivalent getters; just inspect state
      {
        const { name, value } = params as AppOption;
        if (name !== 'refTime') {
          log.info('reducerAction.SET_APP_OPTION', name, value);
        }
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

    case reducerAction.SET_TIMER_TICK_INTERVAL:
      {
        const interval = params as number;
        newState.timerTickInterval = interval;
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

    default:
      break;
  }
  return newState;
}

export default reducer;
