// Redux reducer for the app
import { Polygon } from "@turf/helpers";

import {
  Action,
  ReducerAction,
} from 'lib/actions';

import {
  AppState,
  CountUpdate,
  CacheInfo,
  initialAppState,
  MapRegionUpdate,
} from 'lib/state';
import { LocationEvent, LocationEvents } from 'shared/locations';
import log from 'shared/log';
import { EventType } from 'shared/timeseries';

// This is the reducer: prior state and action determine the revised state. Note the state coming in is immutable.
// Expressions like { ...state, modifiedProp: newValue } help to form newState, which is returned at the end.

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
  try {
    const { params } = action;
    switch (action.type) {

      case ReducerAction.CACHE:
        {
          const cacheInfo = params as CacheInfo;
          if (cacheInfo.activities) {
            newState.cache.activities = [ ...cacheInfo.activities ];
          }
          if (cacheInfo.populated) {
            newState.cache.populated = cacheInfo.populated;
          }
          newState.cache.refreshCount = cacheInfo.refreshCount;
        }
        break;

      // Set newState.userLocation to be the most recent locationEvent
      case ReducerAction.GEOLOCATION:
        {
          // Ignore a redundant locationEvent, one with the same timepoint as userLocation.
          const locationEvents = params as LocationEvents;
          if (locationEvents) {
            for (let i = locationEvents.length - 1; i >= 0; i--) {
              const event = locationEvents[i];
              if (event.type === EventType.LOC) { // TODO if not, input is invalid
                const locationEvent = event as LocationEvent;
                // Ignore redundant locationEvent with same timepoint as what we already have
                if (locationEvent && locationEvent.lon && locationEvent.lat &&
                  (!state.userLocation || locationEvent.t > state.userLocation.t)) {
                  newState.userLocation = { ...locationEvent };
                  break;
                }
              }
            }
          }
        }
        break;

      case ReducerAction.MAP_REGION:
        {
          const mapRegionUpdate = params as MapRegionUpdate;
          log.debug('ReducerAction.MAP_REGION', mapRegionUpdate);
          // Set 'initial' values (which should never change, lest map will be re-rendered)
          if (state.mapBoundsInitial === null) {
            newState.mapBoundsInitial = mapRegionUpdate.bounds;
          }
          if (state.mapHeadingInitial === null) {
            newState.mapHeadingInitial = mapRegionUpdate.heading;
          }
          if (state.mapZoomInitial === null) {
            newState.mapZoomInitial = mapRegionUpdate.zoomLevel;
          }
          // Set these every time.
          newState.mapBounds = mapRegionUpdate.bounds;
          newState.mapHeading = mapRegionUpdate.heading;
          newState.mapZoom = mapRegionUpdate.zoomLevel;
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

      case ReducerAction.SET_CALLBACK:
        {
          newState.callbacks = {
            ...state.callbacks,
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
  } catch (err) {
    log.error('Reducer exception', err);
  } finally {
    return newState;
  }
}

export default reducer;
