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
import { LocationEvent, LocationEvents, TickEvent } from 'shared/locations';
import log from 'shared/log';
import timeseries, { EventType } from "shared/timeseries";

// This is the reducer: prior state and action determine the revised state. Note the state coming in is immutable.
// Expressions like { ...state, modifiedProp: newValue } help to form newState, which is returned at the end.

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
        if (!state.events.length) {  // special case: no existing events
          newState.events = newEvents;
          break;
        }
        const mergedEvents: GenericEvents = timeseries.mergeEvents(state.events, newEvents);

        // Merge sort two non-empty sorted event lists into mergedEvents (replaced by timeseries.mergeEvents)
        // let eventsIndex = 0, newEventsIndex = 0;
        // while (eventsIndex < state.events.length || newEventsIndex < newEvents.length) {
        //   if (eventsIndex < state.events.length &&
        //      (newEventsIndex >= newEvents.length || state.events[eventsIndex].t <= newEvents[newEventsIndex].t)) {
        //       mergedEvents.push(state.events[eventsIndex]);
        //       eventsIndex++;
        //     }
        //   else if (newEventsIndex < newEvents.length &&
        //       (eventsIndex >= state.events.length || newEvents[newEventsIndex].t <= state.events[eventsIndex].t)) {
        //       mergedEvents.push(newEvents[newEventsIndex]);
        //       newEventsIndex++;
        //     }
        //   // TODO consider eliminating duplicates, which would make ADD_EVENTS idempotent
        // }
        newState.events = mergedEvents;
      }
      break;

    case ReducerAction.GEOLOCATION:
      {
        // Ignore a redundant locationEvent, one with the same timepoint as userLocation.
        const locationEvents = params as LocationEvents;
        const newEvents: LocationEvents = [];

        // set newState.userLocation to be the most recent locationEvent
        for (let i = locationEvents.length - 1; i >= 0; i--) {
          const event = locationEvents[i];
          if (event.type === EventType.LOC) { // TODO if not, input is invalid
             const locationEvent = event as LocationEvent;
             if (locationEvent &&
                 locationEvent.loc &&
                 (!state.userLocation || locationEvent.t > state.userLocation.t)) {
                                      // Ignore redundant locationEvent with same timepoint as what we already have
              newState.userLocation = { ...locationEvent };
              newEvents.push(locationEvent);
              break;
            }
          }
        }
        if (newEvents.length) {
          newState.events = timeseries.sortEvents([...newState.events, ...newEvents]);
        }
      }
      break;

    case ReducerAction.MAP_REGION:
      {
        const mapRegion = params as Polygon;
        newState.mapRegion = mapRegion;
      }
      break;

    case ReducerAction.TICK_EVENT:
      {
        const tickEvent = params as TickEvent;
        if (tickEvent.t && tickEvent.type === EventType.TICK) {
          newState.events = timeseries.sortEvents([ ...newState.events, tickEvent ]);
          // log.trace(`${newState.events.length} total events`);
        }
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
        log.trace(`SERVER_SYNC_COMPLETED: ${countSynced}/${timestamps.length} synced, ${pending} pending`);
      }
      break;

    case ReducerAction.SET_APP_OPTION: // no need for equivalent getters; just inspect state
      {
        newState.options = {
          ...state.options,
          ...params, // TODO watch out; zero validation of incoming params!
        }
      }
      break;

    case ReducerAction.SET_TIMER_TICK_INTERVAL:
      {
        const interval = params as number;
        newState.timerTickInterval = interval;
      }
      break;

    case ReducerAction.FLAG_DISABLE:
      {
        const flagName = params as string;
        newState.flags = { ...state.flags };
        newState.flags[flagName] = false;
      }
      break;

    case ReducerAction.FLAG_ENABLE:
      {
        const flagName = params as string;
        newState.flags = { ...state.flags };
        newState.flags[flagName] = true;
      }
      break;

    case ReducerAction.FLAG_TOGGLE:
      {
        const flagName = params as string;
        newState.flags = { ...state.flags };
        newState.flags[flagName] = !state.flags[flagName];
      }
      break;

    default:
      break;
  }
  return newState;
}

export default reducer;
