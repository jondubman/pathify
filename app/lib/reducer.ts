// Redux reducer for the app
import {
  Action,
  GeolocationParams,
  ReducerAction,
} from 'lib/actions';

import {
  AppState,
  CacheInfo,
  Current,
  initialAppState,
} from 'lib/state';
import { MapRegionUpdate } from 'presenters/MapArea';
import log from 'shared/log';

// This is the reducer: prior state and action determine the revised state. Note the state coming in is immutable.
// Expressions like { ...state, modifiedProp: newValue } help to form newState, which is returned at the end.

const reducer = (state: AppState = initialAppState, action: Action): AppState => {
  const newState = { ...state }; // shallow copy for now
  try {
    const { params } = action;
    switch (action.type) {

      case ReducerAction.CACHE:
        {
          const cacheInfo = params as CacheInfo; // what info is being cached now?
          if (cacheInfo.activities) {
            newState.cache.activities = [...cacheInfo.activities];
            if (cacheInfo.populated) {
              newState.cache.populated = cacheInfo.populated;
            }
            newState.cache.refreshCount = cacheInfo.refreshCount;
          }
          if (cacheInfo.exportedActivities) {
            // These just accumulate and cannot really be deleted. This is a cache, so none of this is persisted.
            newState.cache.exportedActivities = {...state.cache.exportedActivities, ...cacheInfo.exportedActivities};
          }
        }
        break;

      case ReducerAction.GEOLOCATION:
        {
          newState.userLocation = params;
          // Ignore a redundant locationEvent, one with the same timepoint as userLocation.
          const geoloc = params as GeolocationParams;
          if (!state.userLocation || geoloc.t > state.userLocation.t) {
            newState.userLocation = geoloc.locationEvent;
          }
        }
        break;

      case ReducerAction.MAP_REGION:
        {
          const mapRegionUpdate = params as MapRegionUpdate;
          // log.trace('ReducerAction.MAP_REGION', mapRegionUpdate);
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
          // Set these whenever they are provided.
          if (mapRegionUpdate.bounds) {
            newState.mapBounds = [...mapRegionUpdate.bounds]; // ensure reference inequality
          }
          if (mapRegionUpdate.heading !== undefined) {
            newState.mapHeading = mapRegionUpdate.heading; // required, 0 is default (due north orientation)
          }
          if (mapRegionUpdate.zoomLevel) {
            newState.mapZoom = mapRegionUpdate.zoomLevel; // also required, even though these may seem sort of redundant
          }
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

      case ReducerAction.SET_CURRENT:
        {
          newState.current = {
            ...state.current,
            ...params, // TODO watch out; zero validation of incoming params!
          } as Current;
        }
        break;

      case ReducerAction.SET_REF:
        {
          newState.refs = {
            ...state.refs,
            ...params, // TODO watch out; zero validation of incoming params!
          }
        }
        break;

      case ReducerAction.SET_SAMPLES:
        {
          newState.samples = [
            ...params, // TODO watch out; zero validation of incoming params!
          ]
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
