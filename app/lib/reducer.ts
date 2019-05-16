//  Redux reducer for the app

import { Feature } from "@turf/helpers";

import {
  Action,
  reducerAction,
} from 'lib/actions';

import { LocationEvent } from 'lib/geo'; // TODO update
import log from 'lib/log';

import {
  initialAppState,
  AppOption,
  AppState,
  GenericEvent,
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
          log.trace(`${newState.events.length} events`);
        }
      }
      break;

    case reducerAction.MAP_REGION:
      {
        const mapRegion = params as Feature;
        newState.mapRegion = mapRegion;
      }
      break;

    case reducerAction.SERVER_SYNC_COMPLETED:
      {
        const timestamps = params as number[];
        const lengthPrev = newState.events.length;
        newState.events = newState.events.filter((event: GenericEvent) => {
          return !(event.sync && event.sync.changed && timestamps.includes(event.sync.changed))
        })
        const countSynced = lengthPrev - newState.events.length;
        log.debug(`SERVER_SYNC_COMPLETED: ${countSynced} synced, ${newState.events.length} remaining`);
      }
      break;

    case reducerAction.SET_APP_OPTION: // no need for equivalent getters; just inspect state
      {
        const { name, value } = params as AppOption;
        log.info('reducerAction.SET_APP_OPTION', name, value);
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
