// For use with redux-saga.
//
// These are the asynchronous handlers for app actions defined in actionTypes module.
// These may include other (cascading) app actions and/or reducer actions.
// A lot of the interactive behaviors of the app are defined here.
// Note reducers, unlike sagas, must always be synchronous.
// appActions are actually run through the reducer before any sagas are run, but the reducer ignores them.
// redux-saga makes extensive use of the JS concept of generators; these generators yield descriptors of effects.
//
// Blocking:
//   Use yield call to call an async function instead of calling it directly (yield the call effect)
//   yield take
//   yield join
//
// Non-blocking:
//   Use yield put instead of dispatch to issue a Redux action (be it an AppAction or ReducerAction.)
//   yield fork
//   yield cancel
//
// IMPORTANT:
// Here, only, you must use yield select instead of accessing the store directly (yield the select effect)
// Inside one of these sagas, you should generally use yield call for any async function call.
// Use yield call(log...) instead of log directly (yield call effect) so the call happens at the right time.

import {
  CameraSettings,
} from '@react-native-mapbox-gl/maps';
import {
  Alert,
  AlertButton,
  Vibration,
} from 'react-native';
import RNRestart from 'react-native-restart';
import {
  call,
  delay,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { DomainPropType } from 'victory-native';

import {
  AbsoluteRelativeOption,
  Action,
  AppAction,
  newAction,
  ReducerAction,

  ActivityListScrolledParams,
  AddEventsParams,
  AppStateChangeParams,
  CenterMapParams,
  ClockPressParams,
  ClosePanelsParams,
  ContinueActivityParams,
  DelayedActionParams,
  DeleteActivityParams,
  ExportActivityParams,
  GeolocationParams,
  ImportActivityParams,
  LogActionParams,
  RefreshActivityParams,
  RefreshCachedActivityParams,
  RepeatedActionParams,
  ScrollActivityListParams,
  ScrollTimelineParams,
  SelectActivityParams,
  SequenceParams,
  SleepParams,
  StartActivityParams,
  TimelineRelativeZoomParams,
  UserMovedMapParams,
  ZoomToActivityParams,
} from 'lib/actions'
import {
  Activity,
  ActivityData,
  ActivityDataExtended,
  exportActivity,
  extendedActivities,
  loggableActivity,
} from 'lib/activities';
import {
  AppUserActionEvent,
  AppStateChange,
  AppStateChangeEvent,
  AppUserAction,
} from 'lib/appEvents';
import constants from 'lib/constants';
import database, {
  LogMessage,
  SettingsObject
} from 'lib/database';
import { Geo } from 'lib/geo';
import locations, {
  LocationEvent,
  LonLat,
  ModeChangeEvent,
  modeChangeToNumber,
  modeIsMoving,
  MotionEvent,
} from 'lib/locations';
import log from 'shared/log';
import {
  MarkEvent,
  MarkType
} from 'lib/marks';
import timeseries, {
  EventType,
  GenericEvent,
  TimeRange,
} from 'lib/timeseries';
import { msecToString } from 'lib/units';
import {
  cachedActivity,
  cachedActivityForTimepoint,
  currentActivity,
  getCachedPathInfo,
  getStoredLocationEvent,
  loggableOptions,
  mapPadding,
  menuOpen,
  pulsars,
  selectedActivity,
  selectedActivityPath,
  timelineVisibleTime,
  timelineZoomValue,
} from 'lib/selectors';
import { postToServer } from 'lib/server';
import {
  AppState,
  CacheInfo,
  Current,
  MapRegionUpdate,
  persistedFlags,
  persistedOptions,
} from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapUtils } from 'presenters/MapArea';
import {
  AppQueryParams,
  AppQueryResponse
} from 'shared/appQuery';

let _interval; // used by timelineRelativeZoom saga

const sagas = {

  // root saga wires things up
  root: function* () {
    // Avoid boilerplate by automatically yielding takeEvery for each AppAction
    for (let action in AppAction) {
      if (AppAction[action]) {
        // yield call(log.trace, 'configuring saga for AppAction', action);
        if (action === AppAction.setAppOptionASAP || action === AppAction.timerTick) { // special case
          // With this action, *any* prior call to these actions not yet processed is ignored, so use with care!
          // This is really only appropriate for isolated rapid event sources like a slider that is being dragged.
          yield takeLatest(AppAction[action], sagas[AppAction[action]]);
        } else {
          // General case
          yield takeEvery(AppAction[action], sagas[AppAction[action]]);
        }
      } else {
        yield call(log.warn, 'unknown action in AppAction enum', action);
      }
    }
    // equivalent to
    // yield takeEvery(AppAction.firstAction, sagas.firstAction);
    // yield takeEvery(AppAction.secondAction, sagas.secondAction);
    // yield takeEvery(AppAction.thirdAction, sagas.thirdAction);
    // ...
  },

  // From here on, functions are alphabetized:

  activityListReachedEnd: function* (action: Action) {
    const { flags, options } = yield select((state: AppState) => state);
    const { appState } = options;
    if (appState !== AppStateChange.STARTUP) { // TODO probably a redundant guard
      if (!flags.timelineScrolling && !flags.timelineNow) {
        yield call(log.trace, 'saga activityListReachedEnd: enabling timelineNow');
        yield put(newAction(AppAction.flagEnable, 'timelineNow'));
      }
    }
  },

  activityListScrolled: function* (action: Action) {
    const params = action.params as ActivityListScrolledParams;
    const { t } = params;
    const { timelineScrolling } = yield select((state: AppState) => state.flags);
    yield call(log.scrollEvent, 'activityListScrolled', timelineScrolling, t);
    if (!timelineScrolling) {
      yield put(newAction(AppAction.setAppOption, { scrollTime: t, viewTime: t }));
    }
  },

  // Note: To keep this simple it's currently required that added events be sorted by t and consistent in activityId.
  addEvents: function* (action: Action) {
    try {
      const params = action.params as AddEventsParams;
      const { events } = params;
      // First, add the given events. This is the easy part. The rest is side effects.
      if (events && events.length) {
        yield call(database.createEvents, events);
      }
      // Now update any Activity/Activities related to the added events.
      // The Activity is essentially a redundant, persisted summary of events with the same activityId.
      // Activities are then cached in Redux state in "extended" form with additional properties that make it more
      // readily consumable. (See ActivityDataExtended.) It would/should be possible to reconstruct these from the events.
      let activityId: string | undefined;
      let firstNewLoc: LocationEvent | undefined;
      let firstNewOdo: number = 0;
      let lastNewLoc: LocationEvent | undefined;
      let previousEventTimestamp = 0;

      // Scan through the new events. This is a simple loop.
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const id = event.activityId;
        if (event.t < previousEventTimestamp) {
          yield call(log.warn, 'addEvents: added events are out of order');
        } else {
          previousEventTimestamp = event.t;
        }
        if (activityId && id && id !== activityId) {
          yield call(log.warn, 'addEvents: multiple activityIds detected (not yet supported)');
          return;
        } else {
          if (id) {
            activityId = id;
          }
        }
        if (event.type === EventType.LOC) {
          if (!firstNewLoc) {
            firstNewLoc = event as LocationEvent;
          }
          const locEvent = event as LocationEvent;
          if (locEvent.odo && !firstNewOdo) {
            firstNewOdo = locEvent.odo;
          }
          lastNewLoc = event as LocationEvent;
        }
      }
      if (activityId) {
        const activity: Activity = yield call(database.activityById, activityId);
        if (activity) {
          const { schemaVersion } = constants.database;
          const activityUpdate: ActivityData = {
            id: activity.id,
            schemaVersion,
            count: (activity.count || 0) + events.length,
          }
          if (firstNewLoc && !activity.tFirstLoc) {
            activityUpdate.tFirstLoc = firstNewLoc.t;
          }
          // If the firstNewLoc comes after activity's tLastUpdate, we are simply appending. !! converts to boolean.
          // The typical case of simply appending one or more events to an Activity is handled here with little work.
          // We simply append to the path and avoid reformulating it entirely.
          // The case of inserting events in the middle of an existing Activity is handled by the else block below.
          const appending: boolean = !!(!firstNewLoc || (activity.tLastUpdate && firstNewLoc.t > activity.tLastUpdate));
          if (appending) {
            let latestLocEvent: LocationEvent | undefined = undefined; // TODO need to remember this
            // odoStart
            if (firstNewOdo) {
              if (!activity.odoStart || firstNewOdo < activity.odoStart) {
                activityUpdate.odoStart = firstNewOdo;
              }
            }
            // odo
            if (lastNewLoc) {
              activityUpdate.tLastLoc = Math.max(activity.tLastLoc || 0, lastNewLoc.t);
              activityUpdate.odo = lastNewLoc.odo;
            }
            // Scan through the new events.
            const pathUpdate = yield call(database.newPathUpdate, activityId);
            let ele: number | undefined,
                lon: number | undefined,
                lat: number | undefined,
                odo: number | undefined,
                speed: number | undefined,
                t: number | undefined,
                modeNumeric: number = 0;

            for (let i = 0; i < events.length; i++) {
              const event = events[i];
              const { type } = event;
              if (type === EventType.LOC) { // take whatever info we can from this LOC event
                latestLocEvent = event as LocationEvent;
                if (latestLocEvent.accuracy  && latestLocEvent.accuracy > constants.paths.metersAccuracyRequired) {
                  continue;
                }
                ele = latestLocEvent.ele;
                lon = latestLocEvent.lon;
                lat = latestLocEvent.lat;
                odo = latestLocEvent.odo;
                speed = latestLocEvent.speed;
                t = latestLocEvent.t;
                // modeNumeric left alone
              } else {
                const current: Current = yield select((state: AppState) => state.current);
                if (current.ele && current.lon && current.lat && current.odo && current.speed && current.tChangedMoving) {
                  ele = current.ele;
                  lon = current.lon;
                  lat = current.lat;
                  odo = current.odo;
                  speed = current.speed;
                  t = current.tChangedMoving;
                  modeNumeric = current.modeNumeric || 0; // may be overwritten below
                }
              }
              if (type === EventType.MODE) {
                const {
                  mode,
                  confidence,
                } = event as ModeChangeEvent;
                modeNumeric = (mode && confidence) ? modeChangeToNumber({ mode, confidence }) : 0;
              }
              if ((type == EventType.LOC || type == EventType.MODE) &&
                 ((t !== undefined) && (lat !== undefined) && (lon !== undefined)))
              {
                // add a single path segment
                activityUpdate.latMax = Math.max(activity.latMax || -Infinity, lat!);
                activityUpdate.latMin = Math.min(activity.latMin || Infinity, lat!);
                activityUpdate.lonMax = Math.max(activity.lonMax || -Infinity, lon!);
                activityUpdate.lonMin = Math.min(activity.lonMin || Infinity, lon!);
                pathUpdate.ele.push(ele || constants.paths.elevationUnvailable);
                pathUpdate.lats.push(lat);
                pathUpdate.lons.push(lon);
                pathUpdate.mode.push(modeNumeric);
                pathUpdate.odo.push(odo);
                pathUpdate.speed.push(speed || 0);
                pathUpdate.t.push(t);
              }
            }
            yield call(database.appendToPath, pathUpdate);

            // maxGaps (maxGapTime, tMaxGapTime, maxGapDistance, tMaxGapDistance)
            if (activity.tLastLoc && firstNewLoc) {
              const gapTime = firstNewLoc.t - activity.tLastLoc;
              if (!activity.maxGapTime || gapTime > activity.maxGapTime) {
                activityUpdate.maxGapTime = gapTime;
                activityUpdate.tMaxGapTime = activity.tLastLoc;
              }
              if (firstNewLoc.odo && activity.odo) {
                const gapDistance = firstNewLoc.odo - activity.odo;
                if (!activity.maxGapDistance || gapDistance > activity.maxGapDistance) {
                  activityUpdate.maxGapDistance = gapDistance;
                  activityUpdate.tMaxGapDistance = activity.tLastLoc;
                }
              }
            }
            activityUpdate.tLastUpdate = utils.now();
            yield call(database.updateActivity, activityUpdate);
          } /* appending */ else {
            // not simply appending events; recalc entire path et al (note new events were already added above)
            yield put(newAction(AppAction.refreshActivity, { id: activity.id }));
          }
        }
      }
    } catch (err) {
      yield call(log.error, 'addEvents', err);
    }
  },

  // appQuery is used for debugging and (currently) internal import/export.
  // TODO disable for production
  appQuery: function* (action: Action) {
    try {
      const params = action.params as AppQueryParams;
      yield call(log.debug, 'appQuery', params);
      const { query, uuid } = params;
      const queryType = query ? query.type : null;
      const state = (yield select((state: AppState) => state)) as AppState;
      let response: any = `response to uuid ${uuid}`; // generic fallback response
      switch (queryType) {

        case 'activities': { // all
          let realmActivities = yield call(database.activities);
          let results = [] as any;
          let activities = Array.from(realmActivities) as any;
          for (let i = 0; i < activities.length; i++) {
            let modifiedActivity = yield call(loggableActivity, activities[i]);
            results.push(modifiedActivity);
          }
          response = { results };
          break;
        }
        case 'activity': { // default to current or selected if activityId not specified
          const activity = query.activityId ? yield call(database.activityById, query.activityId)
            : (yield call(currentActivity, state)) || (yield call(selectedActivity, state));
          let results = [] as any;
          if (activity) {
            let modifiedActivity = yield call(loggableActivity, activity);
            results.push({ activity: modifiedActivity });
            if (query.events && (query.startIndex || query.startIndex === 0) && query.limit) {
              const events = (yield call(database.events)).filtered(`activityId == "${activity.id}"`);
              const start = query.startIndex;
              const end = query.startIndex + query.limit;
              results.push({ events: query.count ? events.length : Array.from(events).slice(start, end)})
            }
            response = { results };
          }
          break;
        }
        case 'activityIds': {
          const activityIds = yield call(database.activityIds);
          const { currentActivityId, selectedActivityId } = state.options;
          response = {
            activityIds,
            counts: {
              deleted: (activityIds.deleted).length,
              kept: (activityIds.kept).length,
              orphaned: (activityIds.orphaned).length,
            },
            currentActivityId,
            selectedActivityId,
          }
          break;
        }
        case 'bounds': {
          const { mapBounds, mapBoundsInitial, mapHeading, mapHeadingInitial, mapZoom, mapZoomInitial } = state;
          response = { mapBounds, mapBoundsInitial, mapHeading, mapHeadingInitial, mapZoom, mapZoomInitial };
          break;
        }
        case 'cache': {
          const cache: CacheInfo = state.cache;
          response = {
            activityCount: cache.activities.length,
            populated: cache.populated || false,
            refreshCount: cache.refreshCount,
          }
          break;
        }
        case 'counts': {
          response = {
            activities: (yield call(database.activities)).length,
            counts: yield call(utils.counts),
            events: (yield call(database.events)).length,
            logs: (yield call(database.logs)).length,
            paths: (yield call(database.paths)).length,
            schemaVersion: constants.database.schemaVersion,
            timeSinceAppStartedUp: msecToString(utils.now() - state.options.startupTime),
          }
          break;
        }
        case 'current': {
          response = state.current;
          break;
        }
        case 'emailLog': {
          Geo.emailLog();
          break;
        }
        case 'events': { // TODO
          const events = yield call(database.events);
          response = query.count ? events.length : Array.from(events);
          break;
        }
        case 'eventCount': { // quick count of the total, no overhead
          response = (yield call(database.events)).length;
          break;
        }
        case 'exportActivity': {
          const { activityId } = params.query as ExportActivityParams;
          yield call(log.debug, 'exportActivity', activityId);
          if (activityId === undefined) {
            response = 'missing activityId';
          } else {
            if (activityId) {
              const activity = yield call(database.activityById, activityId);
              if (activity) {
                response = yield call(exportActivity, activity);
              } else  {
                response = `activityId not found: ${activityId}`;
              }
            } else {
              response = 'no activityId included';
            }
          }
          break;
        }
        case 'flags': { // quick count of the total, no overhead
          response = state.flags;
          break;
        }
        case 'locs': {
          response = {
            userLocation: state.userLocation,
          }
          break;
        }
        case 'logs': {
          const level = query.level || 0;
          const timeRange = query.timeRange || [0, Infinity];
          const pageSize = query.pageSize || Infinity;
          const logs = (yield call(database.logs))
            .filtered('t >= $0 AND t <= $1', timeRange[0], timeRange[1]);
          const leveledLogs = (level ? yield call(logs.filtered, 'level != "trace"') : logs)
            .slice(query.startIndex || 0, Math.min(pageSize, constants.maxLogsToTransmit));
          response = leveledLogs.map((message: LogMessage) => (
            {
              t: message.t,
              level: message.level,
              items: message.items.map((item: any) => JSON.parse(item)),
            }
          ))
          break;
        }
        case 'options': {
          response = yield call(loggableOptions, state);
          break;
        }
        case 'pathMode': {
          const path = selectedActivityPath(state);
          response = path && path.mode && Array.from(path.mode);
          break;
        }
        case 'ping': {
          response = 'pong';
          break;
        }
        case 'pulsars': {
          response = yield call(pulsars, state);
          break;
        }
        case 'selectedActivity': {
          let activity = yield call(selectedActivity, state);
          let results = [] as any;
          if (activity) {
            let modified = yield call(loggableActivity, activity);
            results.push(modified);
            response = { results };
          }
          break;
        }
        case 'settings': {
          const settings = yield call(database.settings);
          response = {
            ...settings,
            pausedTime_: new Date(settings.pausedTime).toString(),
            updateTime_: new Date(settings.updateTime).toString(),
          }
          break;
        }
        case 'status': {
          const { cache, mapBounds, mapBoundsInitial, mapHeading, mapHeadingInitial, mapZoom, mapZoomInitial } = state;
          response = {
            bounds: { mapBounds, mapBoundsInitial, mapHeading, mapHeadingInitial, mapZoom, mapZoomInitial },
            cache: {
              activityCount: cache.activities.length,
              populated: cache.populated || false,
              refreshCount: cache.refreshCount,
            },
            counts: {
              activities: (yield call(database.activities)).length,
              counts: yield call(utils.counts),
              events: (yield call(database.events)).length,
              logs: (yield call(database.logs)).length,
              paths: (yield call(database.paths)).length,
              schemaVersion: constants.database.schemaVersion,
              timeSinceAppStartedUp: msecToString(utils.now() - state.options.startupTime),
            },
            current: state.current,
            flags: state.flags,
            isDebugVersion: utils.isDebugVersion,
            options: yield call(loggableOptions, state),
            pastLocationCached: yield call(getCachedPathInfo, state),
            pastLocationStored: yield call(getStoredLocationEvent, state),
            pulsars: yield call(pulsars, state),
            userLocation: state.userLocation,
          }
          break;
        }
        case 'userLocation': {
          response = state.userLocation;
          break;
        }
      }
      const appQueryResponse: AppQueryResponse = { response, uuid };
      yield call(postToServer as any, 'push/appQueryResponse', { type: 'appQueryResponse', params: appQueryResponse});
    } catch(err) {
      yield call(log.error, 'appQuery', err);
    }
  },

  appStartupCompleted: function* (action: Action) {
    yield call(log.info, 'appStartupCompleted');
    // used with yield take, doesn't need to do anything else
  },

  appStateChange: function* (action: Action) {
    const params = action.params as AppStateChangeParams;
    const { manual, newState } = params; // manual param not currently used for anything but logging
    const { appStartupCompleted } = yield select((state: AppState) => state.flags);
    if (!appStartupCompleted) {
      yield take(AppAction.appStartupCompleted); // Wait for startup to complete if needed.
    }
    yield call(log.info, `appStateChange saga: ${newState}${manual ? ', invoked manually' : ''}`);
    const activating = (newState === AppStateChange.ACTIVE);
    yield put(newAction(activating ? AppAction.flagEnable : AppAction.flagDisable, 'appActive'));
    yield put(newAction(AppAction.setAppOption, { appState: newState }));
    const newAppStateChangeEvent = (newState: AppStateChange): AppStateChangeEvent => ({
      t: utils.now(),
      type: EventType.APP,
      newState,
    })
    yield put(newAction(AppAction.addEvents, { events: [newAppStateChangeEvent(newState)] }));
    const {
      recoveryMode,
      setPaceAfterStart,
      trackingActivity,
    } = yield select((state: AppState) => state.flags);
    if (activating) { // Don't do this in the background... might take too long
      yield call(Geo.countLocations);
      if (!recoveryMode) {
        yield call(Geo.processSavedLocations); // Let's get this started ASAP.
      }
      yield call(Geo.setConfig, trackingActivity, false); // background false, meaning foreground
      if (setPaceAfterStart && trackingActivity) {
        yield call(Geo.changePace, true, () => {}); // manually set pace to moving when activating TODO
      }
      const populated = yield select((state: AppState) => state.cache.populated);
      yield call(log.debug, 'cache has been populated:', populated);
      if (!populated) {
        yield put(newAction(AppAction.refreshCache));
      }
    } else {
      if (newState === AppStateChange.BACKGROUND) {
        yield call(Geo.setConfig, trackingActivity, true); // background true
      }
    }
  },

  // The 'background' is unlikely to be actually visible as it's generally covered entirely by the map.
  backgroundTapped: function* (action: Action) {
    yield call(log.trace, 'saga backgroundTapped');
  },

  // Store objects in the Redux cache.
  cache: function* (action: Action) {
    try {
      yield put(newAction(ReducerAction.CACHE, action.params as CacheInfo));
    } catch(err) {
      yield call(log.error, 'saga cache', err);
    }
  },

  // Center map on absolute position or relative to current position (see CenterMapParams).
  // Note this has the side effect of disabling following on the map if the center is moved.
  centerMap: function* (action: Action) {
    try {
      yield call(log.trace, 'saga centerMap');
      const haveUserLocation = yield select((state: AppState) => !!state.userLocation);
      const map = MapUtils();
      if (map && map.flyTo) {
        const params = action.params as CenterMapParams;
        yield call(log.trace, 'saga centerMap', params);
        const { center, option, zoom } = params;
        if (center) {
          let newCenter = center;
          if (option === AbsoluteRelativeOption.relative) {
            const currentCenter = yield call(map.getCenter as any);
            yield call(log.trace, 'saga centerMap: currentCenter', currentCenter);
            newCenter = [currentCenter[0] + center[0], currentCenter[1] + center[1]];
          }
          if ((center[0] || center[1]) && haveUserLocation) {
            yield put(newAction(AppAction.stopFollowingPath)); // otherwise map may hop right back
            yield put(newAction(AppAction.stopFollowingUser)); // otherwise map may hop right back
          }
          if (zoom && newCenter) { // optional in CenterMapParams; applies for both absolute and relative
            const config: CameraSettings = {
              animationDuration: constants.map.centerMapDuration,
              centerCoordinate: newCenter,
              zoomLevel: zoom,
            }
            yield call(map.setCamera as any, config);
          } else {
            yield call(map.moveTo as any, newCenter); // moveTo is less visually jarring than flyTo in the general case
          }
        }
      } else {
        yield call(log.warn, 'centerMap saga called with missing map');
      }
    } catch (err) {
      yield call(log.error, 'saga centerMap', err);
    }
  },

  // This has the side effect of panning the map component imperatively. Note use of flyTo which makes it more fluid.
  // This should not affect zoom.
  centerMapOnPath: function* () {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const state = yield select((state: AppState) => state);
        const pathInfo = yield call(getCachedPathInfo, state);
        if (pathInfo) {
          yield call(log.trace, 'saga centerMapOnPath: missing pathInfo');
          if (state.flags.animateMapWhenFollowingPath) {
            const config: CameraSettings = {
              animationDuration: constants.map.centerMapDuration,
              centerCoordinate: pathInfo.loc,
            }
            yield call(map.setCamera as any, config);
          } else {
            yield call(map.flyTo as any, pathInfo.loc);
          }
        } else {
          yield call(log.info, 'saga centerMapOnPath: missing pathInfo');
        }
      } else {
        yield call(log.warn, 'saga centerMapOnPath: missing map');
      }
    } catch (err) {
      yield call(log.error, 'saga centerMapOnPath', err);
    }
  },

  // This has the side effect of panning the map component imperatively. Note use of flyTo which makes it more fluid.
  // This should not affect zoom.
  centerMapOnUser: function* () {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const userLocation = yield select((state: AppState) => state.userLocation);
        if (userLocation && userLocation.lon && userLocation.lat) {
          yield call(map.flyTo as any, locations.lonLat(userLocation));
        } else {
          yield call(log.info, 'saga centerMapOnUser: missing userLocation');
        }
      } else {
        yield call(log.warn, 'saga centerMapOnUser: missing map');
      }
    } catch (err) {
      yield call(log.error, 'saga centerMapOnUser', err);
    }
  },

  clearLogs: function* () {
    log.debug('saga clearLogs');
    yield call(database.clearLogs);
    log.info('logs cleared');
  },

  // Caution: clearStorage is highly destructive, without warning or confirmation!
  clearStorage: function* () {
    try {
      if (utils.isDebugVersion) { // No way should we do this on production version. With confirmation, if ever...
        yield call(log.warn, 'saga clearStorage on debug version of app - deleting all persisted data!');
        yield call(database.reset); // including Settings
        yield call(Geo.destroyLocations);
        yield call(Geo.destroyLog);
      } else {
        yield call(log.warn, 'saga clearStorage - taking no action, production version!');
      }
    } catch (err) {
      yield call(log.error, 'saga clearStorage', err);
    }
  },

  clockPress: function* (action: Action) {
    const params = action.params as ClockPressParams;
    const nowClock = params && params.nowClock;
    yield call(log.trace, `clockPress, now: ${nowClock}`);
  },

  // Panels here refer to popups / menus.
  closePanels: function* (action: Action) {
    const params = action.params as ClosePanelsParams;
    yield call(log.debug, 'saga closePanels', params);
    const option = (params && params.option) || '';
    const {
      startMenuOpen,
      helpOpen,
      settingsOpen,
      topMenuOpen,
    } = yield select((state: AppState) => state.flags);

    if (helpOpen && option !== 'otherThanHelp') {
      yield put(newAction(AppAction.flagDisable, 'helpOpen'));
    }
    if (settingsOpen && option !== 'otherThanSettings') {
      yield put(newAction(AppAction.flagDisable, 'settingsOpen'));
    }
    if (startMenuOpen && option !== 'otherThanStartMenu') {
      yield put(newAction(AppAction.flagDisable, 'startMenuOpen'));
    }
    if (topMenuOpen && option !== 'otherThanTopMenu') {
      yield put(newAction(AppAction.flagDisable, 'topMenuOpen'));
    }
  },

  completeAppStartup: function* (action: Action) {
    yield call(log.info, 'completeAppStartup');
    yield put(newAction(AppAction.flagEnable, 'appStartupCompleted'));
    yield put(newAction(AppAction.appStartupCompleted)); // so you can yield take(AppAction.appStartupCompleted)
  },

  // Activities are 'continued' automatically when the app is terminated and then restarted during activity tracking,
  // whether the app was restarted manually, by the user, or automatically, in the background.
  continueActivity: function* (action: Action) {
    try {
      const params = action.params as ContinueActivityParams;
      const { activityId } = params;
      yield call(log.info, 'saga continueActivity', activityId);
      yield put(newAction(AppAction.startActivity, { continueActivityId: activityId }));
      yield put(newAction(AppAction.zoomToActivity, { id: activityId, zoomTimeline: true, zoomMap: false })); // in continueActivity
      // const scrollTime = yield select((state: AppState) => state.options.scrollTime);
      // yield put(newAction(AppAction.scrollActivityList, { scrollTime })); // in continueActivity
    } catch (err) {
      yield call(log.error, 'saga continueActivity', err);
    }
  },

  delayedAction: function* (action: Action) {
    try {
      const params = action.params as DelayedActionParams;
      yield delay(params.after);
      yield put(params.run);
    } catch (err) {
      yield call(log.error, 'saga delayedAction', err);
    }
  },

  // TODO paint this activity red on the ActivityList while on the chopping block so it's clear which it is.
  // TODO consider an option to avoid the confirmation alert, at least for testing.
  // TODO delete underlying events?
  deleteActivity: function* (action: Action) {
    try {
      const params = action.params as DeleteActivityParams;
      const { id } = params;
      const {
        currentActivityId,
        scrollTime,
        selectedActivityId,
      } = yield select((state: AppState) => state.options);
      let deleteButton: AlertButton = {
        onPress: () => {
          log.info('Delete activity', id);
          if (id === currentActivityId) {
            log.warn('attempt to delete currentActivity (not permitted)');
            return;
          }
          store.dispatch(newAction(AppAction.refreshCachedActivity, { activityId: id, remove: true }));
          if (id === selectedActivityId) {
            store.dispatch(newAction(AppAction.setAppOption, { selectedActivityId: null }));
          }
          setTimeout(() => {
            database.deleteActivity(id);
            Vibration.vibrate(constants.timing.vibration);
            const { activityList } = store.getState().refs;
            if (activityList) {
              log.debug('activityList.forceUpdate');
              store.dispatch(newAction(AppAction.scrollActivityList, { scrollTime })); // in deleteActivity
            } else {
              log.warn('Missing refs.activityList');
            }
          }, 0)
        },
        text: 'Delete',
        style: 'destructive',
      }
      let cancelButton: AlertButton = {
        onPress: () => {
          log.info('deleteActivity canceled');
        },
        text: 'Cancel',
        style: 'cancel',
      } // cancel is always on the left
      yield call(Alert.alert, 'Delete Activity?', 'This operation cannot be undone.', [deleteButton, cancelButton]);
    } catch (err) {
      yield call(log.error, 'saga deleteActivity', err);
    }
  },

  // After-effects (i.e. downstream side effects) of modifying app flags are handled here.
  flag_sideEffects: function* (flagName: string) {
    const { flags, options } = yield select((state: AppState) => state);
    const enabledNow = flags[flagName];
    const { appStartupCompleted } = flags;
    const { viewTime } = options;
    // Avoid changing settings during startup (instead, we apply previous.)
    if (appStartupCompleted) {
      // Persist persistedFlags in Settings.
      if (persistedFlags.includes(flagName)) {
        yield call(database.changeSettings, { [flagName]: enabledNow }); // Note usage of computed property name.
      }
      if (flagName === 'timelineNow') {
        if (enabledNow) { // this means we just enabled it
          const now = utils.now();
          const pausedTime = viewTime; // the current viewTime (which is about to be changed)
          if (!flags.activityListScrolling && !flags.timelineScrolling) {
            yield put(newAction(AppAction.setAppOption, {
              pausedTime,
              centerTime: now,
              scrollTime: now,
              viewTime: now,
            }))
            yield put(newAction(AppAction.timerTick, now));
          }
        }
      }
      if (flagName === 'trackingActivity') {
        if (flags.setPaceAfterStart && enabledNow) {
          // Set pace to moving to ensure we don't miss anything at the start, bypassing stationary monitoring.
          yield call(Geo.changePace, true, () => {
            log.debug('BackgroundGeolocation pace manually set to moving');
          })
        }
      }
    }
  },

  flagDisable: function* (action: Action) {
    const flagName: string = action.params;
    const flags = yield select((state: AppState) => state.flags);
    if (flags[flagName]) {
      yield put(newAction(ReducerAction.FLAG_DISABLE, flagName));
      yield sagas.flag_sideEffects(flagName);
    }
  },

  flagEnable: function* (action: Action) {
    const flagName: string = action.params;
    const flags = yield select((state: AppState) => state.flags);
    if (!flags[flagName]) {
      yield put(newAction(ReducerAction.FLAG_ENABLE, flagName));
      yield sagas.flag_sideEffects(flagName);
    }
  },

  flagToggle: function* (action: Action) {
    const flagName: string = action.params;
    yield put(newAction(ReducerAction.FLAG_TOGGLE, flagName));
    yield sagas.flag_sideEffects(flagName);
  },

  // Update state.userLocation as appropriate in response to geolocation events.
  // TODO If these events are old or known to be semi-inaccurate, do we still want to do that?
  // Note it is not the responsibility of this saga to add events when locations comes in. See addEvents.
  geolocation: function* (action: Action) {
    try {
      const geoloc = action.params as GeolocationParams;
      const { locationEvent, recheckMapBounds } = geoloc;
      const current = {
        ele: locationEvent.ele,
        lon: locationEvent.lon,
        lat: locationEvent.lat,
        odo: locationEvent.odo,
        speed: locationEvent.speed,
        t: locationEvent.t,
        moving: !!locationEvent.speed,
      } as any as Current;
      yield put(newAction(ReducerAction.SET_CURRENT, current));

      const { lat, lon } = locationEvent;
      const previousUserLocation = yield select((state: AppState) => state.userLocation);
      const { mapMoving } = yield select((state: AppState) => state.flags);
      yield put(newAction(ReducerAction.GEOLOCATION, geoloc)); // this sets state.userLocation
      if (recheckMapBounds && !mapMoving) {
        const appActive = yield select((state: AppState) => state.flags.appActive);
        if (appActive) {
          // Potential cascading AppAction.centerMapOnUser:
          const map = MapUtils();
          if (map) {
            const { centerMapContinuously, followingUser } = yield select((state: AppState) => state.flags);
            const bounds = yield call(map.getVisibleBounds);
            if (followingUser) {
              const loc = [lon, lat] as LonLat;
              const outOfBounds = bounds && !utils.locWellBounded(loc, bounds);
              if (!previousUserLocation || outOfBounds || centerMapContinuously) {
                yield put(newAction(AppAction.centerMapOnUser)); // in geolocation
              }
            }
          }
        }
      }
    } catch (err) {
      yield call(log.error, 'geolocation', err);
    }
  },

  jumpToBackTime: function* (action: Action) {
    yield call(log.debug, 'saga jumpToBackTime');
    const { backTime } = yield select((state: AppState) => state.options);
    yield put(newAction(AppAction.flagDisable, 'timelineNow'));
    yield put(newAction(AppAction.setAppOption, { scrollTime: backTime }));
    yield put(newAction(AppAction.scrollActivityList, { scrollTime: backTime })); // in jumpToBackTime
    yield put(newAction(AppAction.scrollTimeline, { scrollTime: backTime })); // in jumpToBackTime
  },

  jumpToNow: function* (action: Action) {
    yield call(log.debug, 'saga jumpToNow');
    const { timelineNow } = yield select((state: AppState) => state.flags);
    const { viewTime } = yield select((state: AppState) => state.options);
    if (!timelineNow) {
      yield put(newAction(AppAction.setAppOption, { backTime: viewTime })); // TODO might actually want history feature
      yield put(newAction(AppAction.flagEnable, 'timelineNow'));
      const now = utils.now() + constants.timing.timelineCloseToNow; // TODO should not need this fudge factor
      yield put(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in jumpToNow
      yield put(newAction(AppAction.scrollTimeline, { scrollTime: now })); // in jumpToNow
    }
  },

  importActivity: function* (action: Action) {
    try {
      const params = action.params as ImportActivityParams;
      const { include } = params;
      const { activity, path } = include;
      const { id } = activity;
      const pathLengths = {
        ele: path.ele.length,
        lats: path.lats.length,
        lons: path.lons.length,
        mode: path.mode.length,
        odo: path.odo.length,
        speed: path.speed.length,
        t: path.t.length,
      }
      yield call(log.info, 'importActivity', activity, pathLengths);

      // Guard against existing activity with same id
      const existingActivity = yield call(database.activityById, id);
      if (existingActivity) {
        yield call(log.warn, 'importActivity: activityId already exists', id);
      } else {
        yield call(database.updateActivity, activity, path);
        yield call(log.debug, 'imported');
      }
    } catch (err) {
      yield call(log.error, 'importActivity', err);
    }
  },

  // Generate a client-side log with an Action
  log: function* (action: Action) {
    try {
      const params = action.params as LogActionParams;
      const { level, message } = params;
      yield call(log[level || 'debug'], message);
    } catch(err) {
      // eat it
    }
  },

  // Triggered by Mapbox
  mapRegionChanged: function* (action: Action) {
    const mapRegionUpdate = action.params as MapRegionUpdate;
    yield put(newAction(ReducerAction.MAP_REGION, mapRegionUpdate));
    yield put(newAction(AppAction.flagDisable, 'mapMoving'));
    yield put(newAction(AppAction.flagDisable, 'mapReorienting'));
    const { bounds, heading, zoomLevel } = mapRegionUpdate;
    const latMax = bounds[0][1];
    const latMin = bounds[1][1];
    const lonMax = bounds[0][0];
    const lonMin = bounds[1][0];
    const appState = yield select((state: AppState) => state.options.appState);
    if (appState === AppStateChange.STARTUP) {
      yield call(log.trace, 'Skipping database.changeSettings on mapRegionChanged during app startup');
    } else {
      // yield call(log.trace, 'database.changeSettings on mapRegionChanged');
      yield call(database.changeSettings, {
        latMax, latMin, lonMax, lonMin,
        mapHeading: heading,
        mapZoomLevel: zoomLevel,
      })
    }
  },

  // Triggered by Mapbox
  mapRegionChanging: function* (action: Action) {
    yield put(newAction(AppAction.flagEnable, 'mapMoving'));
  },

  mapRendered: function* (action: Action) {
    yield put(newAction(AppAction.flagEnable, 'mapRendered'));
  },

  mapTapped: function* (action: Action) {
    yield call(log.debug, 'saga mapTapped', action.params);
    const state = yield select((state: AppState) => state);
    if (menuOpen(state)) {
      yield put(newAction(AppAction.closePanels));
    } else {
      yield put(newAction(AppAction.flagToggle, 'mapTapped'));
    }
  },

  modeChange: function* (action: Action) {
    try {
      const modeChangeEvent = action.params as ModeChangeEvent;
      const { current } = yield select((state: AppState) => state);
      const moving = modeIsMoving(modeChangeEvent.mode);
      const currentRevised = {
        modeNumeric: modeChangeToNumber({ confidence: modeChangeEvent.confidence, mode: modeChangeEvent.mode }),
        moving,
        t: modeChangeEvent.t,
      } as any as Current;
      if (current.moving === undefined || moving !== current.moving) {
        currentRevised.tChangedMoving = modeChangeEvent.t;
      }
      yield put(newAction(ReducerAction.SET_CURRENT, currentRevised));

      const { appActive } = yield select((state: AppState) => state.flags);
      if (appActive) {
        yield call(log.trace, 'saga modeChange - adding event', modeChangeEvent);
        yield put(newAction(AppAction.addEvents, { events: [modeChangeEvent] }));
      } else {
        // Note we are bypassing all side effects of addEvents when running in the background.
        // TODO consider storing modeChange events as SQLite locations in react-native-background-geolocation plugin.
        yield call(log.trace, 'saga modeChange - handling event in background', modeChangeEvent);
        yield call(database.createEvents, [modeChangeEvent]);
      }
    } catch(err) {
      yield call(log.error, 'saga modeChange', err);
    }
  },

  // TODO motionChange not fully integrated into the app; these events are largely redundant to modeChange.
  motionChange: function* (action: Action) {
    try {
      const motionEvent = action.params as MotionEvent;
      const { appActive } = yield select((state: AppState) => state.flags);
      if (appActive) {
        yield call(log.trace, 'saga motionChange - adding event', motionEvent);
        yield put(newAction(AppAction.addEvents, { events: [motionEvent] }));
      } else {
        // Note we are bypassing all side effects of addEvents when running in the background.
        yield call(log.trace, 'saga motionChange - handling event in background', motionEvent);
        yield call(database.createEvents, [motionEvent]);
      }
    } catch (err) {
      yield call(log.error, 'saga motionChange', err);
    }
  },

  // Refresh (recreate) existing Activity/Path from the raw Events in the database (given an existing Activity id.)
  // Note that Paths contain "redundant" location data when there are MODE events, just as they contain "redundant" mode
  // data for LOC events.
  // TODO It would not take much for this to be able to "undelete" an Activity, if the raw Events are still there.
  // Note: This relies on the underlying events, which are currently missing from imported activities.
  refreshActivity: function* (action: Action) {
    try {
      const params = action.params as RefreshActivityParams;
      let { id } = params;
      if (id === 'selected') { // special case
        id = yield select((state: AppState) => state.options.selectedActivityId); // which is used in appQuery
      }
      yield call(log.trace, 'saga refreshActivity', id);
      const eventsForActivity = yield call(database.eventsForActivity, id);
      const { currentActivityId } = yield select((state: AppState) => state.options);
      const { schemaVersion } = constants.database;
      const activityUpdate: ActivityData = { id, schemaVersion };
      const pathUpdate = yield call(database.newPathUpdate, id);
      activityUpdate.count = eventsForActivity.length;
      let prevLocEvent: LocationEvent | null = null;
      let tStart = 0;
      let latestLocEvent: LocationEvent | undefined = undefined;
      let modeNumeric = 0;
      for (let e of eventsForActivity) { // Loop through all the events. events are already sorted by time.
        const event = e as any as GenericEvent;
        const { type } = event;
        if (type === EventType.LOC) {
          latestLocEvent = event as LocationEvent;
        }
        if (type == EventType.MODE) {
          const {
            mode,
            confidence,
          } = event as ModeChangeEvent;
          modeNumeric = (confidence && mode) ? modeChangeToNumber({ confidence, mode }) : 0;
        }
        if (latestLocEvent && (type == EventType.LOC || type == EventType.MODE)) {
          const {
            accuracy,
            ele,
            lon,
            lat,
            odo,
            speed,
            t,
          } = latestLocEvent;
          if (!tStart || t < tStart) {
            yield call(log.trace, 'refreshActivity: ignoring t < tStart', t, tStart);
            continue;
          }
          if (accuracy && accuracy <= constants.paths.metersAccuracyRequired) { // if sufficiently accurate
            // ele
            pathUpdate.ele.push(ele || constants.paths.elevationUnvailable);
            // lats
            pathUpdate.lats.push(lat);
            activityUpdate.latMax = Math.max(activityUpdate.latMax || -Infinity, lat);
            activityUpdate.latMin = Math.min(activityUpdate.latMin || Infinity, lat);
            // lons
            pathUpdate.lons.push(lon);
            activityUpdate.lonMax = Math.max(activityUpdate.lonMax || -Infinity, lon);
            activityUpdate.lonMin = Math.min(activityUpdate.lonMin || Infinity, lon);
            // mode
            pathUpdate.mode.push(modeNumeric);
            // odo
            pathUpdate.odo.push(odo);
            if (odo) {
              if (!activityUpdate.odo || odo > activityUpdate.odo) {
                yield call(log.trace, odo);
              }
              activityUpdate.odo = Math.max(activityUpdate.odo || -Infinity, odo);
              activityUpdate.odoStart = Math.min(activityUpdate.odoStart || Infinity, odo);
            }
            // speed
            pathUpdate.speed.push(speed);
            // t
            pathUpdate.t.push(t);
          }
          activityUpdate.tFirstLoc = Math.min(activityUpdate.tFirstLoc || t, t);
          activityUpdate.tLastLoc = Math.max(activityUpdate.tLastLoc || 0, t); // max is redundant when events sorted by t
          activityUpdate.tLastRefresh = utils.now();
          activityUpdate.tLastUpdate = Math.max(activityUpdate.tLastUpdate || 0, t); // which they should be

          // maxGaps (maxGapTime, tMaxGapTime, maxGapDistance, tMaxGapDistance)
          if (prevLocEvent !== null) {
            const gapTime = latestLocEvent.t - prevLocEvent.t;
            if (!activityUpdate.maxGapTime || gapTime > activityUpdate.maxGapTime) {
              if (!activityUpdate.maxGapTime || gapTime > activityUpdate.maxGapTime) {
                activityUpdate.maxGapTime = gapTime;
                activityUpdate.tMaxGapTime = prevLocEvent.t;
              }
            }
            if (latestLocEvent.odo && prevLocEvent.odo) {
              const gapDistance = latestLocEvent.odo - prevLocEvent.odo;
              if (!activityUpdate.maxGapDistance || gapDistance > activityUpdate.maxGapDistance) {
                if (!activityUpdate.maxGapDistance || gapDistance > activityUpdate.maxGapDistance) {
                  activityUpdate.maxGapDistance = gapDistance;
                  activityUpdate.tMaxGapDistance = prevLocEvent.t;
                }
              }
            }
          }
          prevLocEvent = latestLocEvent;
        } else if (event.type == EventType.MARK) {
          const markEvent = event as MarkEvent;
          if (markEvent.subtype === MarkType.START) {
            tStart = markEvent.t;
            yield call(log.trace, 'refreshActivity: Found START mark at t:', tStart);
            activityUpdate.tStart = markEvent.t;
          }
          if (markEvent.subtype === MarkType.END) {
            yield call(log.trace, 'refreshActivity: Found END mark at t:', markEvent.t);
            activityUpdate.tEnd = markEvent.t;
          }
        }
        activityUpdate.tLastUpdate = Math.max(activityUpdate.tLastLoc || 0, activityUpdate.tEnd || 0);
        if (id !== currentActivityId && !activityUpdate.tEnd) {
          // This only happens if the END MARK event did not get properly inserted.
          activityUpdate.tEnd = activityUpdate.tLastUpdate;
        }
      }
      yield call(database.updateActivity, activityUpdate, pathUpdate);
      yield call(utils.addToCount, 'refreshedActivities');
    } catch(err) {
      yield call(log.error, 'saga refreshActivity', err);
    } finally {
      yield put(newAction(AppAction.refreshActivityDone));
    }
  },

  // This looks a no-op, but the AppAction.refreshActivityDone is used with yield take in refreshAllActivities and
  // every AppAction has a corresponding saga.
  refreshActivityDone: function* (action: Action) {
    yield call(log.trace, 'refreshActivityDone');
  },

  // Note this is potentially time-consuming and might "hang up" the app for a while.
  // With order 1M events on a modern device - a few months of activities - it could take maybe a minute to complete.
  // This isn't actually used in production.
  refreshAllActivities: function* (action: Action) {
    const activityIds = yield call(database.activityIds);
    if (activityIds) {
      let count = 0;
      for (let id of activityIds.kept) {
        yield put(newAction(AppAction.refreshActivity, { id })); // initiate activity refresh
        yield take(AppAction.refreshActivityDone); // wait for it to finish
        // TODO could pause here
        count++;
        yield call(log.trace, 'refreshAllActivities: refreshActivityDone', count, id);
      }
    }
  },

  refreshCache: function* (action: Action) {
    try {
      yield call(log.trace, 'saga refreshCache');
      const timestamp = yield call(utils.now);
      const realmActivities = yield call(database.activities);
      const activitiesAsArray = Array.from(realmActivities) as ActivityData[]
      const activities = extendedActivities(activitiesAsArray);
      const refreshCount = (yield select((state: AppState) => state.cache.refreshCount)) + 1;
      yield put(newAction(AppAction.cache, { activities, populated: true, refreshCount }));
      const now = yield call(utils.now);
      yield call(log.debug, 'new refreshCount', refreshCount, 'msec', now - timestamp, 'count', activities.length);
      yield put(newAction(AppAction.refreshCacheDone));
    } catch(err) {
      yield call(log.error, 'saga refreshCache', err);
    }
  },

  refreshCacheDone: function* (action: Action) {
    yield call(log.trace, 'refreshCacheDone');
    const scrollTime = yield select((state: AppState) => state.options.scrollTime);
    yield put(newAction(AppAction.scrollActivityList, { scrollTime })); // in refreshCacheDone
  },

  // updates, or removes stale entry from cache, as needed
  refreshCachedActivity: function* (action: Action) {
    try {
      const params = action.params as RefreshCachedActivityParams;
      const id = params.activityId;
      const { remove } = params;
      // yield call(log.trace, 'saga refreshCachedActivity', id);
      const refreshCount = (yield select((state: AppState) => state.cache.refreshCount)) + 1;
      const activity = remove ? null : database.activityById(id);
      if (activity) {
        const activities = [...(yield select((state: AppState) => state.cache.activities || []))];
        const extendedActivity = extendedActivities(Array.from([activity]) as ActivityData[])[0];
        const extendedActivityIndex = activities.findIndex(activity => activity.id === extendedActivity.id);
        if (extendedActivityIndex >= 0) {
          activities[extendedActivityIndex] = extendedActivity;
        } else {
          activities.push(extendedActivity);
        }
        yield put(newAction(AppAction.cache, { activities, refreshCount }));
      } else {
        const activities = (yield select((state: AppState) => state.cache.activities)) as ActivityDataExtended[];
        const activitiesFiltered = activities.filter(activity => activity.id !== id);
        yield put(newAction(AppAction.cache, { activities: activitiesFiltered, refreshCount }));
      }
    } catch (err) {
      yield call(log.error, 'saga refreshCachedActivity', err);
    }
  },

  // Set map bearing to 0 (true north) typically in response to user action (button).
  reorientMap: function* () {
    const map = MapUtils();
    if (map) {
      yield call(log.debug, 'saga reorientMap');
      yield put(newAction(AppAction.flagEnable, 'mapMoving'));
      yield put(newAction(AppAction.flagEnable, 'mapReorienting'));
      const obj = { heading: 0, animationDuration: constants.map.reorientationTime };
      map.setCamera(obj);
    }
  },

  // See sequence saga. This looks like a no-op; the saga is, because it needs to exist, but the action is still useful.
  repeatedAction: function* () {
  },

  // TODO not for production use
  restartApp: function* () {
    yield call(log.warn, 'saga restartApp');
    yield call(log.info, RNRestart);
    yield call(RNRestart.Restart);
  },

  scrollActivityList: function* (action: Action) {
    yield call(log.scrollEvent, 'saga scroll scrollActivityList');
    const params = action.params as ScrollActivityListParams;
    const { scrollTime } = params;
    const refs = yield select((state: AppState) => state.refs);
    const { activityList } = refs;
    if (activityList !== undefined && activityList.scrollToTime) {
      yield call(log.scrollEvent, 'saga scrollActivityList:', scrollTime);
      yield call(activityList.scrollToTime, scrollTime); // in saga scrollActivityList
    } else {
      yield call(log.scrollEvent, 'saga scrollActivityList: activityList is not ready yet');
    }
  },

  scrollTimeline: function* (action: Action) {
    const { timelineScrolling } = yield select((state: AppState) => state.flags);
    if (timelineScrolling) {
      yield call(log.scrollEvent, 'saga scrollTimeline: timelineScrolling already');
    } else {
      const params = action.params as ScrollTimelineParams;
      const { scrollTime } = params;
      const refs = yield select((state: AppState) => state.refs);
      const { timelineScroll } = refs;
      if (timelineScroll !== undefined && timelineScroll.scrollToTime) {
        yield call(log.scrollEvent, 'saga scrollTimeline:', scrollTime);
        yield call(timelineScroll.scrollToTime, scrollTime); // in saga scrollTimeline
      } // else nothing to scroll (like if Timeline is hidden) TODO hmm, can refs to go stale when component unmounted?
    }
  },

  // This is used when tapping an activity in the ActivityList. It zooms both the map and the timeline, neither of which
  // is done in the general case of simply scrolling the Timeline or ActivityList. The midpoint of the activity is used
  // as the reference timepoint;. This is intended for most intentional type of selection, configuring the app UI to
  // focus on the specified activity.
  selectActivity: function* (action: Action) {
    try {
      const params = action.params as SelectActivityParams;
      const id = params.id;
      yield call(log.debug, 'saga selectActivity', id);
      const state = yield select((state: AppState) => state);
      const activity = yield call(cachedActivity, state, id);
      if (activity) {
        yield call(log.debug, 'saga selectActivity: activity found', id);
        const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
          (activity.tStart + utils.now()) / 2;
        if (activity.tEnd) {
          // Pressing some prior activity.
          yield put(newAction(AppAction.flagDisable, 'timelineNow'));
          yield put(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in selectActivity
        } else {
          // Pressing the currentActivity.
          log.debug('selectActivity: Pressing the currentActivity', new Date(newTime).toString());
          yield put(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in selectActivity
        }
        const appOptions = {
          centerTime: newTime, // TODO is it necessary to set this here?
          scrollTime: newTime,
          selectedActivityId: activity.id,
          viewTime: newTime,
        }
        log.debug('selectActivity setting appOptions', appOptions);
        yield put(newAction(AppAction.setAppOption, appOptions));
        yield put(newAction(AppAction.zoomToActivity, { id: activity.id, zoomTimeline: true, zoomMap: true })); // both
      }
    } catch (err) {
      yield call(log.error, 'saga selectActivity', err);
    }
  },

  // The sequence action is an array of actions to be executed in sequence, such that
  //    -- the sleep action can be interspersed, and works as expected, delaying subsequent actions in the sequence;
  //    -- repeatedAction behaves as expected when containing a sub-sequence
  sequence: function* (action: Action) {
    try {
      const runSequenceActions = async (sequenceActions: Action[]) => {
        for (let sequenceAction of sequenceActions) {
          log.debug('sequenceAction', sequenceAction);
          if (sequenceAction.type === AppAction.sleep) { // sleep gets special treatment to ensure blocking execution
            const sleepTime = (sequenceAction.params as SleepParams).for;
            await new Promise(resolve => setTimeout(resolve, sleepTime));
          }
          if (sequenceAction.type === AppAction.repeatedAction) {
            const times = (sequenceAction.params as RepeatedActionParams).times;
            for (let i = 0; i < times; i++) {
              await runSequenceActions([sequenceAction.params.repeat]);
            }
          } else if (sequenceAction.type === AppAction.sequence) {
            await runSequenceActions(sequenceAction.params); // using recursion to support nested sequences
          } else {
            store.dispatch(sequenceAction); // note use of store.dispatch rather than yield put
          }
        }
      }
      const innerActions = action.params as SequenceParams;
      setTimeout(async () => { // using setTimeout so we can trigger an async function
        await runSequenceActions(innerActions);
      }, 0)
      // TODO evaluate the following:
      //
      // for (let innerAction of innerActions) {
      //   yield put(innerAction);
      // }
    } catch (err) {
      yield call(log.error, 'saga sequence', err);
    }
  },

  setAppOption: function* (action: Action) {
    // First, actually set the options!
    const { params } = action;
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));

    // Next, handle option side effects:
    const state: AppState = yield select((state: AppState) => state);
    const {
      activityListScrolling,
      appStartupCompleted,
      timelineNow,
      timelineScrolling,
    } = state.flags;
    if (!appStartupCompleted) {
      yield call(log.trace, 'setAppOption: appStartupCompleted false, skipping side-effects');
      return;
    }
    // An important side effect: Whenever viewTime is set, pausedTime may also be updated.
    // Note that setting scrollTime (which changes as the Timeline is scrolled) lacks these side effects.
    // Note that the AppAction.setAppOption within this block recurses back into this saga, but only one level deep.
    if (params.viewTime !== undefined) {
      const t = params.viewTime;
      if (timelineNow) {
        if (t < utils.now() - constants.timing.timelineCloseToNow) {
          yield put(newAction(AppAction.flagDisable, 'timelineNow'));
          yield call(log.scrollEvent, 'setAppOption: disabled timelineNow as side effect of setting viewtime');
        }
      } else {
        // Setting viewTime when timeline is paused updates pausedTime.
        // pausedTime is used to 'jump back' to a previous timepoint. This could easily be turned into a history stack.
        yield call(log.scrollEvent, 'Setting viewTime when timeline is paused updates pausedTime:', t);
        yield put(newAction(AppAction.setAppOption, { pausedTime: t }));
      }
      // If viewTime is too far from the current timeline center, re-center timeline around viewTime.
      const {
        centerTime,
        timelineZoomValue,
      } = state.options;
      const visibleTime = yield call(timelineVisibleTime, timelineZoomValue);
      const timeGap = Math.abs(centerTime - t);
      const recenterThreshold = visibleTime * (constants.timeline.widthMultiplier / 3);
      const ratio = timeGap / recenterThreshold;
      yield call(log.scrollEvent,
        `timeline centerTime-viewTime gap ${timeGap} threshold ${recenterThreshold} ratio ${ratio}`);
      if (timeGap > recenterThreshold) {
        yield put(newAction(AppAction.setAppOption, { centerTime: t }));
        yield call(log.scrollEvent, `setAppOption reset centerTime ${t}`);
      } else {
        // viewTime is in range on the timeline, so just scroll timeline to it.
        yield put(newAction(AppAction.scrollTimeline, { scrollTime: t }));
      }
    }
    if (params.scrollTime !== undefined) { // if setting scrollTime:
      // Set selectedActivityId as appropriate:
      const activity: Activity = yield call(cachedActivityForTimepoint, state, params.scrollTime);
      if (!activity || !activity.id) {
        if (state.options.selectedActivityId) {
          yield put(newAction(AppAction.setAppOption, { selectedActivityId: null }));
        }
      } else if (activity && activity.id !== state.options.selectedActivityId) {
        // This is where selectedActivity is set to the activity for the new viewTime.
        yield put(newAction(AppAction.setAppOption, { selectedActivityId: activity.id }));
      }
      if (timelineScrolling && !activityListScrolling) {
        yield put(newAction(AppAction.scrollActivityList, { scrollTime: params.scrollTime })); // in setAppOption
        yield call(log.scrollEvent, 'setAppOption: scrollActivityList to scrollTime:', params.scrollTime);
      }
    }
    // Write through to settings in database.
    // Note that if starting up (the early return above), we avoid writing the same settings we just read.
    const newSettings = {} as any;
    for (let propName of persistedOptions) {
      if (params[propName] !== undefined) {
        newSettings[propName] = params[propName];
      }
    }
    const newSettingsCount = Object.entries(newSettings).length;
    if (newSettingsCount) {
      yield call(log.trace, 'Writing settings to database', newSettings);
      yield call(database.changeSettings, newSettings);
    }
  },

  // This is a wrapper that looks like a pass-through, but uses takeLatest (not take) in the root saga. Use with care!
  // takeLatest should only be used when intermediate values are redundant.
  setAppOptionASAP: function* (action: Action) {
    yield put(newAction(AppAction.setAppOption, action.params));
  },

  setRef: function* (action: Action) {
    try {
      yield put(newAction(ReducerAction.SET_REF, action.params));
    } catch (err) {
      yield call(log.error, 'saga setRef', err);
    }
  },

  // sleep is a non-production script-originated action, to facilitate automated testing.
  // Note sleep only works as expected if enclosed in a sequence action; sequence is where sleep is really implemented.
  // Behavior is odd when nesting sequences involving sleep and repeated actions if not enclosed in a sequence.
  // Mostly, more things will happen in parallel than you might anticipate, due to the somewhat subtle semantics of
  // these redux-saga generators, which cannot use async/await.
  sleep: function* () {
  },

  // Start (or continue!) an Activity:
  startActivity: function* (action: Action) {
    try {
      const params = action.params as StartActivityParams || {};
      yield call(log.info, 'saga startActivity', params);
      const continueActivityId = params.continueActivityId || undefined;
      const trackingActivity = yield select((state: AppState) => state.flags.trackingActivity);
      if (!trackingActivity) {
        yield put(newAction(AppAction.flagEnable, 'trackingActivity'));
        yield call(Vibration.vibrate, constants.timing.vibration);
        const background = yield select((state: AppState) => !!(state.options.appState === AppStateChange.BACKGROUND));
        yield call(Geo.setConfig, true, background);
        const now = utils.now();
        let activityId: string;
        if (continueActivityId) {
          // should already have the AppUserActionEvent and MarkEvent from before; just set currentActivityId.
          activityId = continueActivityId;
        } else {
          yield put(newAction(AppAction.flagEnable, 'timelineNow'));
          yield put(newAction(AppAction.flagDisable, 'mapTapped'));
          const followingNow = yield select((state: AppState) => state.flags.followingUser);
          if (followingNow) {
          } else {
            yield put(newAction(AppAction.startFollowingUser));
          }
          const newActivity = yield call(database.createActivity, now);
          activityId = newActivity.id;
          const startEvent: AppUserActionEvent = {
            ...timeseries.newSyncedEvent(now, activityId),
            type: EventType.USER_ACTION,
            userAction: AppUserAction.START,
          }
          const startMark: MarkEvent = {
            ...timeseries.newSyncedEvent(now, activityId),
            activityId,
            type: EventType.MARK,
            subtype: MarkType.START,
          }
          yield put(newAction(AppAction.addEvents, { events: [startEvent, startMark] }));
        }
        yield put(newAction(AppAction.setAppOption,
          { currentActivityId: activityId, selectedActivityId: activityId }));
        yield put(newAction(AppAction.refreshCachedActivity, { activityId }));
        yield delay(0); // TODO was required to allow ActivityList to ready itself to scroll... race condition? still?
        const scrollTime = utils.now();
        yield put(newAction(AppAction.scrollActivityList, { scrollTime })); // in startActivity
      }
    } catch (err) {
      yield call(log.error, 'saga startActivity', err);
    }
  },

  // This saga is run when the app first starts up, and also when it is restarted after being suspended/terminated.
  // The app may be restarted in the background if tracking an activity and the user has moved beyond a geofence around
  // the last location before the app was terminated. The app may also be restarted manually after having been
  // terminated. If the app is restarted while tracking an activity, continueActivity is invoked. This is its own saga
  // but is essentially an option to startActivity.
  startupActions: function* () {
    try {
      const runningInBackgroundNow = utils.appInBackground();
      yield call(database.completeAnyMigration);
      const { recoveryMode, startupAction_clearStorage } = yield select((state: AppState) => state.flags);
      yield call(log.debug, 'saga startupActions');
      if (startupAction_clearStorage) {
        yield put(newAction(AppAction.clearStorage)); // BOOM!
      }
      const settings = (yield call(database.settings)) as SettingsObject;
      yield call(log.info, 'Saved App settings', settings);
      // restore app options from settings
      const newSettings = {} as any;
      for (let propName of persistedOptions) {
        if (settings[propName] !== undefined) {
          newSettings[propName] = settings[propName];
        }
      }
      // restore app flags from settings
      for (let propName of persistedFlags) {
        if (settings[propName] !== undefined) {
          const actionType = (settings[propName] ? AppAction.flagEnable : AppAction.flagDisable);
          yield put(newAction(actionType, propName)); // TODO any reason not to set these all at once?
        }
      }
      const propagatedSettings = {} as any; // TODO really mean type of AppState options
      if (newSettings.pausedTime) {
        propagatedSettings.centerTime = newSettings.pausedTime;
        propagatedSettings.scrollTime = newSettings.pausedTime;
        propagatedSettings.viewTime = newSettings.pausedTime;
      }
      if (Object.entries(newSettings).length) {
        yield call(log.debug, 'Reading settings from database', newSettings);
        yield put(newAction(AppAction.setAppOption, { ...newSettings, ...propagatedSettings }));
      }
      const {
        currentActivityId,
        pausedTime,
        latMax,
        latMin,
        lonMax,
        lonMin,
        grabBarSnapIndex,
        mapHeading,
        mapZoomLevel,
        timelineNow,
      } = settings;
      const bounds = [[lonMax, latMax], [lonMin, latMin]];
      yield put(newAction(ReducerAction.MAP_REGION, { bounds, heading: mapHeading, zoomLevel: mapZoomLevel }));
      yield call(log.debug, `startupActions: initial map bounds ${bounds}, heading ${mapHeading} zoom ${mapZoomLevel}`);
      yield put(newAction(AppAction.flagEnable, 'mapEnable'));
      const grabBarSnapIndexPreview = grabBarSnapIndex;
      yield put(newAction(AppAction.setAppOption, {
        grabBarSnapIndexPreview,
      }))
      yield put(newAction(AppAction.flagEnable, 'showGrabBar'));
      if (pausedTime) {
        yield call(log.trace, 'startupActions: pausedTime', pausedTime);
        yield put(newAction(AppAction.setAppOption, { // Note all these timestamps are aligned on startup.
          pausedTime,
          centerTime: pausedTime,
          scrollTime: pausedTime,
          viewTime: pausedTime,
        }))
      }
      const tracking = !!currentActivityId;
      const launchedInBackground = yield call(Geo.initializeGeolocation, store, tracking);
      yield call(log.debug, `startupActions: launchedInBackground ${launchedInBackground}`);
      yield call(Geo.startBackgroundGeolocation);
      if (!recoveryMode) {
        if (!runningInBackgroundNow) {
          yield put(newAction(AppAction.refreshCache));
          yield take(AppAction.refreshCacheDone); // This shouldn't take long. Simpler to have it out of the way.
        }
        if (tracking) {
          yield call(log.info, 'Continuing previous activity...');
          yield put(newAction(AppAction.continueActivity, { activityId: currentActivityId })); // this will follow user
        } else {
          if (pausedTime) {
            const activity = (yield call(database.activityForTimepoint, pausedTime)) as Activity | null;
            if (activity && activity.id) {
              yield call(log.trace, 'startupActions: activity.id', activity.id);
              yield put(newAction(AppAction.zoomToActivity, { id: activity.id, zoomTimeline: false, zoomMap: false })); // in startupActions
            }
          }
        }
      }
      // Now that we are through all the startup actions, ready to change appState from STARTUP to ACTIVE or BACKGROUND.
      const newState = runningInBackgroundNow ? AppStateChange.BACKGROUND : AppStateChange.ACTIVE;
      yield put(newAction(AppAction.appStateChange, { manual: true, newState }));
      yield put(newAction(AppAction.completeAppStartup));
      yield take(AppAction.appStartupCompleted); // wait for state flag to be enabled (as the above is async)
      if (timelineNow) {
        const { flags } = yield select((state: AppState) => state);
        if (!flags.timelineNow) {
          yield call(log.trace, 'timelineNow was enabled in settings but got disabled during startup - re-enabling');
          setTimeout(() => {
            store.dispatch(newAction(AppAction.flagEnable, 'timelineNow'));
          }, constants.timing.activityListDelayReadjustmentAfterStartup);
        }
      } else if (pausedTime) {
        setTimeout(() => {
          store.dispatch(newAction(AppAction.setAppOption, { // TODO somehow these are drifting slightly - investigate.
            pausedTime,
            centerTime: pausedTime,
            scrollTime: pausedTime,
            viewTime: pausedTime,
          }))
          store.dispatch(newAction(AppAction.scrollActivityList, { scrollTime: pausedTime })); // in startupActions
        }, constants.timing.activityListDelayReadjustmentAfterStartup);
      }
    } catch (err) {
      yield call(log.error, 'startupActions exception', err);
    }
  },

  stopActivity: function* () {
    try {
      const { refreshActivityOnStop, trackingActivity } = yield select((state: AppState) => state.flags);
      if (trackingActivity) {
        yield put(newAction(AppAction.flagDisable, 'trackingActivity'));
        yield call(Vibration.vibrate, constants.timing.vibration);
        const activityId = yield select((state: AppState) => state.options.currentActivityId);
        const now = utils.now();
        const stopEvent: AppUserActionEvent = {
          ...timeseries.newSyncedEvent(now, activityId),
          type: EventType.USER_ACTION,
          userAction: AppUserAction.STOP,
        }
        const endMark: MarkEvent = {
          ...timeseries.newSyncedEvent(now, activityId),
          type: EventType.MARK,
          subtype: MarkType.END,
        }
        yield put(newAction(AppAction.addEvents, { events: [stopEvent, endMark] }));
        const activity = yield call(database.activityById, activityId);
        yield call(log.debug, 'stopActivity', loggableActivity(activity));
        if (activity) {
          yield call(database.updateActivity, {
            id: activityId,
            schemaVersion: constants.database.schemaVersion, // TODO make sure to handle schema update while tracking
            tLastUpdate: now,
            tEnd: now,
          })
        } else {
          yield call(log.warn, 'Missing activity in stopActivity')
        }
        yield put(newAction(AppAction.flagDisable, 'timelineNow'));
        const halfTime = activity.tStart + (now - activity.tStart) / 2;
        yield call(log.trace, 'stopActivity: halfTime', halfTime);
        yield put(newAction(AppAction.setAppOption,
          { currentActivityId: null, selectedActivityId: activityId, scrollTime: halfTime, viewTime: halfTime }));
        yield put(newAction(AppAction.zoomToActivity, { id: activity.id, zoomTimeline: true, zoomMap: true })); // in stopActivity
        yield put(newAction(AppAction.scrollActivityList, { scrollTime: halfTime })); // in stopActivity
        if (refreshActivityOnStop) {
          yield put(newAction(AppAction.refreshActivity, { id: activity.id }));
        }
      }
    } catch (err) {
      yield call(log.error, 'saga stopActivity', err);
    }
  },

  // Follow the path, recentering map right away.
  startFollowingPath: function* () {
    try {
      yield call(log.debug, 'saga startFollowingPath');
      const { followingPath } = yield select((state: AppState) => state.flags);
      if (!followingPath) {
        yield put(newAction(AppAction.flagDisable, 'followingUser')); // mutual exclusion
        yield put(newAction(AppAction.flagEnable, 'followingPath'));
      }
    } catch (err) {
      yield call(log.error, 'saga startFollowingPath', err);
    }
  },

  startFollowingUser: function* (action: Action) {
    try {
      yield call(log.debug, 'saga startFollowingUser');
      const { followingUser } = yield select((state: AppState) => state.flags);
      if (!followingUser) {
        yield put(newAction(AppAction.flagDisable, 'followingPath')); // mutual exclusion
        yield put(newAction(AppAction.flagEnable, 'followingUser'));
      }
    } catch (err) {
      yield call(log.error, 'saga startFollowingUser', err);
    }
  },

  stopFollowing: function* (action: Action) {
    try {
      yield call(log.trace, 'saga stopFollowing');
      const { followingPath, followingUser } = yield select((state: AppState) => state.flags);
      if (followingPath) {
        yield put(newAction(AppAction.stopFollowingPath));
        yield take(AppAction.stoppedFollowingPath);
      }
      if (followingUser) {
        yield put(newAction(AppAction.stopFollowingUser));
        yield take(AppAction.stoppedFollowingUser);
      }
      yield put(newAction(AppAction.stoppedFollowing));
    } catch (err) {
      yield call(log.error, 'stopFollowing', err);
    }
  },

  stopFollowingPath: function* () {
    yield call(log.debug, 'saga stopFollowingPath');
    yield put(newAction(AppAction.flagDisable, 'followingPath'));
    yield put(newAction(AppAction.stoppedFollowingPath));
  },

  stopFollowingUser: function* () {
    yield call(log.debug, 'saga stopFollowingUser');
    yield put(newAction(AppAction.flagDisable, 'followingUser'));
    yield put(newAction(AppAction.stoppedFollowingUser));
  },

  stoppedFollowing: function* () {
  },

  stoppedFollowingPath: function* () {
  },

  stoppedFollowingUser: function* () {
  },

  timelineRelativeZoom: function* (action: Action) {
    const { rate } = action.params as TimelineRelativeZoomParams;
    yield call(log.trace, 'timelineRelativeZoom saga', rate);
    const {
      scrollTime,
      timelineZoomValue,
    } = yield select((state: AppState) => state.options);
    const multiplier = constants.timeline.relativeZoomRate;
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }
    let newZoom = timelineZoomValue;
    if (rate) {
      yield put(newAction(AppAction.setAppOption, { centerTime: scrollTime })); // Recenter timeline before zooming it.
      _interval = setInterval(() => {
        newZoom = newZoom + rate * multiplier;
        if (newZoom < 0) {
          newZoom = 0;
        }
        if (newZoom > 1) {
          newZoom = 1;
        }
        // Note the following avoids Realm side effects while zooming, but we still want to persist at the end.
        store.dispatch(newAction(ReducerAction.SET_APP_OPTION, { timelineZoomValue: newZoom }));
        log.trace('timelineRelativeZoom', newZoom);
      }, constants.timing.timelineRelativeZoomStep);
    } else {
      yield put(newAction(AppAction.setAppOptionASAP, { timelineZoomValue : newZoom }));
    }
  },

  // Respond to timeline pan/zoom. x is in the time domain.
  // viewTime changes here only after scrolling, whereas scrollTime changes during scrolling too.
  timelineZoomed: function* (action: Action) { // see also: timelineZooming
    const {
      activityListScrolling,
      timelineScrolling,
    } = yield select((state: AppState) => state.flags);
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const scrollTime = (x[0] + x[1]) / 2;
    yield put(newAction(AppAction.flagDisable, 'timelineScrolling'));
    if (timelineScrolling && !activityListScrolling) {
      yield call(log.scrollEvent, 'timelineZoomed', scrollTime);
      yield put(newAction(AppAction.setAppOption, { scrollTime, viewTime: scrollTime }));
    }
    yield call(log.scrollEvent, 'timelineZoomed', scrollTime, activityListScrolling, timelineScrolling);
  },

  timelineZooming: function* (action: Action) { // see also: timelineZoomed
    const {
      activityListScrolling,
      timelineScrolling,
    } = yield select((state: AppState) => state.flags);
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const scrollTime = (x[0] + x[1]) / 2;
    // Note use of "ASAP" version of setAppOption here to take the latest when we get a flurry of scroll events:
    if (timelineScrolling && !activityListScrolling) {
      yield put(newAction(AppAction.setAppOptionASAP, { scrollTime })); // note: not changing viewTime or centerTime!
    }
    yield call(log.scrollEvent, 'timelineZooming', scrollTime, activityListScrolling, timelineScrolling);
  },

  // This goes off at least once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates and it's the minimum for updating the analog clock
  // and the timeline. More frequent timer ticks make the second hand move more smoothly.
  timerTick: function* (action: Action) {
    const state = yield select((state: AppState) => state);
    const {
      appActive,
      followingPath,
      mapMoving,
      mapReorienting,
      timelineNow,
      timelineScrolling,
      trackingActivity,
    } = state.flags;
    if (appActive) { // avoid ticking the timer in the background
      const now = action.params as number; // note that 'now' is a parameter here. It need not be the real now.
      const nowTimeRounded = Math.floor(now / 1000) * 1000;
      if (nowTimeRounded === state.options.nowTimeRounded) {
        yield put(newAction(AppAction.setAppOption, { nowTime: now }));
      } else {
        const options = { nowTime: now, nowTimeRounded } as any; // always update nowTime
        if (timelineNow) {
          options.scrollTime = now;
          if (!timelineScrolling) { // because if timelineScrolling, user's actions are more important
            options.viewTime = now;
          }
        }
        yield put(newAction(AppAction.setAppOption, options));
        if (followingPath /* && !mapMoving */ && !mapReorienting) {
          const map = MapUtils();
          if (map) {
            const state: AppState = yield select((state: AppState) => state);
            const pathInfo = yield call(getCachedPathInfo, state);
            const bounds = state.mapBounds;
            if (pathInfo && bounds) {
              if (!utils.locWellBounded(pathInfo.loc, bounds)) {
                yield put(newAction(AppAction.centerMapOnPath));
              }
            }
          }
        }
      }
    }
  },

  // Stop following user after panning the map.
  userMovedMap: function* (action: Action) {
    try {
      const { center } = action.params as UserMovedMapParams;
      const map = MapUtils()!;
      const bounds = yield call(map.getVisibleBounds);
      const state = yield select((state: AppState) => state);
      const { followingPath, followingUser } = state.flags;
      let loc: LonLat | null = null;
      if (followingUser) {
        const userLocation = yield select((state: AppState) => state.userLocation);
        if (userLocation) {
          loc = [userLocation.lon, userLocation.lat] as LonLat;
        }
      }
      if (followingPath) {
        const cachedLocation = yield call(getCachedPathInfo, state);
        loc = cachedLocation.loc;
      }
      if (loc) {
        if (utils.locWellBounded(loc, bounds)) {
          yield call(log.trace, 'userMovedMap, but locWellBounded', center);
        } else {
          yield put(newAction(AppAction.stopFollowing));
        }
      }
    } catch (err) {
      yield call(log.error, 'userMovedMap', err);
    }
  },

  // Zoom the map and/or timeline to the duration/bounds of the (cached) Activity.
  zoomToActivity: function* (action: Action) {
    const { id, zoomMap, zoomTimeline } = action.params as ZoomToActivityParams;
    const populated = (yield select((state: AppState) => state.cache.populated));
    if (!populated) {
      yield call(log.info, 'saga zoomToActivity: cache not populated yet', action.params);
      yield take(AppAction.refreshCacheDone); // TODO really we only need the specified activity to have been cached
    }
    const state = (yield select((state: AppState) => state)) as AppState; // careful - this can go stale if done above!
    const activity = cachedActivity(state, id);
    if (activity) {
      yield call(log.debug, `saga zoomToActivity activityId: ${activity.id}`);
      // Fit map bounds to bounds of activity (with padding)
      const { duration } = constants.map.fitBounds;
      const map = MapUtils();
      if (zoomMap && map && map.fitBounds) {
        yield put(newAction(AppAction.stopFollowing));
        const { latMax, latMin, lonMax, lonMin } = activity;
        yield call(log.trace, 'saga zoomToActivity',
          { latMax, latMin, lonMax, lonMin, zoomMap, zoomTimeline });
        if (!state.flags.mapRendered) {
          yield call(log.info, 'saga zoomToActivity: waiting for mapRendered');
          yield take(AppAction.mapRendered);
        }
        if (latMax !== undefined && latMin !== undefined && lonMax !== undefined && lonMin !== undefined) {
          map.fitBounds([lonMax, latMax], [lonMin, latMin], mapPadding(state), duration);
          yield call(log.trace, 'saga zoomToActivity: did fitBounds');
        }
      }
      if (zoomTimeline) {
        // Zoom Timeline to show the entire activity, in context. Note we are not resetting its viewTime, just zooming.
        // If there is no tTotal yet (which is the case for a currentActivity), we use the current now time as the end.
        const tTotal = activity.tTotal || (utils.now() - activity.tStart);
        if (activity.tTotal) {
          const newTimelineZoomValue = yield call(timelineZoomValue, tTotal);
          yield call(log.scrollEvent, 'newTimelineZoomValue', newTimelineZoomValue);
          yield put(newAction(AppAction.setAppOption, { timelineZoomValue: newTimelineZoomValue }));
        }
      }
    }
  },
}

export default sagas;
