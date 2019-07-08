// Redux reducer for the app
// TODO reorganize using combineReducers or something better

import { Polygon } from "@turf/helpers";

import {
  Action,
  ReducerAction,
} from 'lib/actions';

import {
  initialAppState,
  AppState,
} from 'lib/state';
import { GenericEvents } from 'shared/timeseries';
import { LocationEvent } from 'shared/locations';
import log from 'shared/log';
import { EventType } from "shared/timeseries";

// This is the reducer: prior state and action determine the revised state. Note the state coming in is immutable.
// Expressions like { ...state, modifiedProp: newValue } help to form newState, which is returned at the end..

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
  const { params } = action;
  switch (action.type) {

    case ReducerAction.ADD_EVENTS:
      {
        const newEvents = params as GenericEvents;
        if (!newEvents.length) {
          break; // nothing to add
        }
        const mergedEvents: GenericEvents = [];

        log.debug('ADD_EVENTS: existing events count', state.events.length);

        // Merge incoming and existing events (TODO both assumed to be sorted!)
        // TODO: Factor this out into shared timeseries code.
        let eventsIndex = 0, newEventsIndex = 0;

        if (!state.events.length) {  // special case: no existing events
          newState.events = newEvents;
          log.debug('ADD_EVENTS: newState.events count', newState.events.length);
          break;
        }

        // Merge sort two non-empty sorted event lists into mergedEvents.
        while (eventsIndex < state.events.length || newEventsIndex < newEvents.length) {

          if (eventsIndex < state.events.length &&
             (newEventsIndex >= newEvents.length || state.events[eventsIndex].t <= newEvents[newEventsIndex].t)) {

              mergedEvents.push(state.events[eventsIndex]);
              eventsIndex++;
            }
          else if (newEventsIndex < newEvents.length &&
              (eventsIndex >= state.events.length || newEvents[newEventsIndex].t <= state.events[eventsIndex].t)) {

              mergedEvents.push(newEvents[newEventsIndex]);
              newEventsIndex++;
            }
          // TODO consider eliminating duplicates, which would make ADD_EVENTS idempotent
        }
        log.debug('ADD_EVENTS: merged events count', mergedEvents.length);
        newState.events = mergedEvents;
      }
      break;

    case ReducerAction.GEOLOCATION:
      {
        const locationEvent = params as LocationEvent;
        if (locationEvent.data.loc && locationEvent.t && locationEvent.type === EventType.LOC) {
          newState.userLocation = locationEvent;
          newState.events = [...newState.events, locationEvent];
          log.trace(`${newState.events.length} total events`);
        }
      }
      break;

    case ReducerAction.MAP_REGION:
      {
        const mapRegion = params as Polygon;
        newState.mapRegion = mapRegion;
      }
      break;

    case ReducerAction.SERVER_SYNC_COMPLETED:
      {
        const timestamps = params as number[];
        const events = [ ...newState.events ];
        let countChanged = 0, countSynced = 0;
        for (let i = 0; i < events.length; i++) {
          const { changed } = events[i];
          if (changed) {
            countChanged++;
            if (timestamps.includes(changed)) {
              events[i].changed = 0; // This is where it is reset.
              countSynced++;
            }
          }
        }
        newState.events = events;
        const pending = countChanged - countSynced;
        log.debug(`SERVER_SYNC_COMPLETED: ${countSynced}/${timestamps.length} synced, ${pending} pending`);
      }
      break;

    case ReducerAction.SET_APP_OPTION: // no need for equivalent getters; just inspect state
      {
        if (!params.refTime) { // this happens like every second, so logging it is noise
          log.debug('ReducerAction.SET_APP_OPTION', params);
        }
        newState.options = {
          ...state.options,
          ...params, // TODO watch out; zero validation of incoming params!
        }
      }
      break;

    case ReducerAction.SET_PANEL_VISIBILITY:
      {
        const panelName = params.name as string;
        const open = params.open as boolean;
        newState.ui = { ...state.ui };
        newState.ui.panels = { ...state.ui.panels };
        newState.ui.panels[panelName].open = open;
      }
      break;

    case ReducerAction.SET_TIMER_TICK_INTERVAL:
      {
        const interval = params as number;
        newState.timerTickInterval = interval;
      }
      break;

    case ReducerAction.UI_FLAG_DISABLE:
      {
        const flagName = params as string;
        newState.ui = { ...state.ui };
        newState.ui.flags = { ...state.ui.flags };
        newState.ui.flags[flagName] = false;
      }
      break;

    case ReducerAction.UI_FLAG_ENABLE:
      {
        const flagName = params as string;
        newState.ui = { ...state.ui };
        newState.ui.flags = { ...state.ui.flags };
        newState.ui.flags[flagName] = true;
      }
      break;

    case ReducerAction.UI_FLAG_TOGGLE:
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
