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

import { v4 as uuidv4 } from 'uuid';

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
  EnableTestScenarioParams,
  ExportActivityParams,
  GeolocationParams,
  ImportActivityParams,
  LogActionParams,
  RefreshActivityParams,
  RefreshCachedActivityParams,
  ReorientMapParams,
  RepeatedActionParams,
  RequestLocationPermissionParams,
  ScrollActivityListParams,
  ScrollTimelineParams,
  SelectActivityParams,
  SequenceParams,
  SimulateLocationParams,
  SleepParams,
  StartActivityParams,
  StartSimulatingLocationParams,
  StartupActionParams,
  StopSimulatingLocationParams,
  TimelineRelativeZoomParams,
  UserMovedMapParams,
  ZoomToActivityParams,
} from 'lib/actions'
import {
  ActivityTimeProps,
  Activity,
  ActivityData,
  ActivityDataExtended,
  exportActivity,
  ExportedActivity,
  extendActivity,
  extendedActivities,
  LocationSimulationOptions,
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
  SettingsObject,
} from 'lib/database';
import {
  Geo,
  LocationInfo,
} from 'lib/geo';
import {
  introPages,
} from 'lib/intro';
import locations, {
  LocationEvent,
  LonLat,
  ModeChangeEvent,
  modeChangeToNumber,
  modeIsMoving,
  ModeType,
  MotionEvent,
  numberToModeType,
} from 'lib/locations';
import log from 'shared/log';
import {
  MarkEvent,
  MarkType
} from 'lib/marks';
import { PathUpdate } from 'lib/paths';
import timeseries, {
  interval,
  EventType,
  Events,
  GenericEvent,
  TimeRange,
} from 'lib/timeseries';
import { msecToString } from 'lib/units';
import {
  cachedActivity,
  cachedActivityForTimepoint,
  currentActivity,
  currentOrSelectedActivity,
  currentCachedActivity,
  getCachedPathInfo,
  getStoredLocationEvent,
  loggableOptions,
  mapPadding,
  mapPosition,
  menuOpen,
  pulsars,
  selectedActivity,
  selectedActivityPath,
  timelineVisibleTime,
  timelineZoomValue,
} from 'lib/selectors';
import {
  pollServer,
  postToServer,
 } from 'lib/server';
import {
  AppState,
  CacheInfo,
  Current,
  persistedFlags,
  persistedOptions,
} from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapRegionUpdate, MapUtils } from 'presenters/MapArea';
import {
  AppQueryParams,
  AppQueryResponse,
} from 'shared/appQuery';

let _interval: NodeJS.Timeout | null; // used by timelineRelativeZoom saga

const sagas = {

  // root saga wires things up
  root: function* () {
    // Avoid boilerplate by automatically yielding takeEvery for each AppAction
    for (const action in AppAction) {
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
    const { appStartupCompleted, timelineScrolling } = yield select((state: AppState) => state.flags);
    const cachePopulated = yield select((state: AppState) => state.cache.populated);
    if (appStartupCompleted && cachePopulated && !timelineScrolling) {
      // yield call(log.trace, 'activityListScrolled, timelineScrolling:', timelineScrolling, 't:', t);
      yield put(newAction(AppAction.setAppOption, { scrollTime: t, viewTime: t }));
    }
  },

  // Note: To keep this simple it's currently required that added events be sorted by t and consistent in activityId.
  addEvents: function* (action: Action) {
    try {
      const params = action.params as AddEventsParams;
      const {
        events,
        forceRefresh,
        preventRefresh,
      } = params;
      // First, add the given events. This is the easy part. The rest is side effects.
      if (events && events.length) {
        yield call(database.createEvents, events);
      }
      if (preventRefresh) {
        return; // early return
      }
      // Now update any Activity/Activities related to the added events.
      // The Activity is essentially a redundant, persisted summary of events with the same activityId.
      // Activities are then cached in Redux state in "extended" form with additional properties that make it more
      // readily consumable (see ActivityDataExtended) It would/should be possible to reconstruct these from the events.
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
          const appending: boolean = !!(!firstNewLoc || (activity.tLastUpdate && firstNewLoc.t > activity.tLastUpdate));
          if (forceRefresh || !appending) {
            // This handles the case of inserting events in the middle of an existing Activity.
            // Note new events were already added above.
            yield put(newAction(AppAction.refreshActivity, { id: activity.id }));
          } else {
            // The typical case of simply appending one or more events to an Activity is handled here.
            // We simply append to the path and avoid reformulating it entirely.
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
                if (latestLocEvent.accuracy && latestLocEvent.accuracy > constants.paths.metersAccuracyRequired) {
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
                // Handle EventType.MODE
                const current: Current = yield select((state: AppState) => state.current);
                // TODO review: is current almost guaranteed to be wrong when we are adding a bunch of events at once?
                // In that case, we don't want the current location; we want the location last seen in this loop.
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
                pathUpdate.ele.push(ele || constants.paths.elevationUnavailable);
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
            activityUpdate.tLastUpdate = yield call(utils.now);
            yield call(database.updateActivity, activityUpdate);
          }
        }
      }
    } catch (err) {
      yield call(log.error, 'addEvents', err);
    }
  },

  // appQuery is used for debugging and (currently internal-only) import/export.
  // The responses are mostly intended to be human-readable for debugging.
  // The queryType is just a string, and response is any free-form, untyped data.
  appQuery: function* (action: Action) {
    const params = action.params as AppQueryParams;
    yield call(log.debug, 'appQuery', params);
    const { query, uuid } = params;
    try {
      const state = (yield select((state: AppState) => state)) as AppState;
      let response: any = `generic response to appQuery with uuid ${uuid}`; // fallback response
      const queryStartTime = yield call(utils.now); // milliseconds
      const timeSinceAppStartedUp = msecToString(queryStartTime - state.options.startupTime);
      const queryType = query ? query.type : null;
      switch (queryType) {

        case 'activities': {
          const realmActivities: Realm.Results<Activity> = yield call(database.activities);
          let filteredActivities = realmActivities;
          if (query.activityRangeQueries) {
            for (const [prop, range] of Object.entries(query.activityRangeQueries)) {
              const min = range[0];
              const max = range[1];
              yield call(log.debug, `range filtering ${prop}: ${min} to ${max}`);
              filteredActivities = filteredActivities.filtered(`${prop} >= $0 AND ${prop} <= $1`, min, max);
            }
          }
          const results = [] as any;
          const activities = Array.from(filteredActivities) as any;
          for (let i = query.startIndex || 0; i < activities.length; i++) {
            let modifiedActivity = yield call(extendActivity, activities[i]);
            if (!query.limit || results.length < query.limit) {
              results.push(modifiedActivity);
            }
          }
          response = query.countOnly ? results.length : { results };
          break;
        }
        case 'activity': { // a single activity, defaulting to current or selected if activityId not specified
          const activity = query.activityId ? yield call(database.activityById, query.activityId)
            : (yield call(currentActivity, state)) || (yield call(selectedActivity, state));
          let results = [] as any;
          if (activity) {
            let modifiedActivity = yield call(extendActivity, activity);
            results.push({ activity: modifiedActivity });
            if (query.includeEvents && (query.startIndex || query.startIndex === 0) && query.limit) {
              const events = (yield call(database.events)).filtered(`activityId == "${activity.id}"`);
              const start = query.startIndex;
              const end = query.startIndex + query.limit;
              results.push({ events: query.countOnly ? events.length : Array.from(events).slice(start, end)})
            }
            response = { results };
          }
          break;
        }
        case 'activityIds': { // just the Ids
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
        case 'bounds': { // of map
          response = mapPosition(state);
          break;
        }
        case 'cache': { // of activities
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
            events: (yield call(database.events)).length,
            logs: (yield call(database.logs)).length,
            paths: (yield call(database.paths)).length,
            samples: state.samples.length,
            schemaVersion: constants.database.schemaVersion,
            timeSinceAppStartedUp,
            'utils.counts': yield call(utils.counts),
          }
          break;
        }
        case 'current': { // location
          response = state.current;
          break;
        }
        case 'emailLog': {
          yield call(Geo.emailLog); // TODO This is one of the ways to debug react-native-background-geolocation.
          break;
        }
        case 'eventCount': { // quick count of the total, no overhead
          response = (yield call(database.events)).length;
          break;
        }
        case 'events': { // TODO surely you don't want to do this with a million events... likely to hang the app
          const events = yield call(database.events);
          response = query.countOnly ? events.length : Array.from(events);
          break;
        }
        // Export a single activity by activityId.
        // Note this is not a public GPX export, which probably needs to exist, but a dev-only export feature for
        // debugging, screenshots, etc. that exports an individual activity as JSON compatible with importActivity.
        case 'exportActivity': {
          const { activityId } = params.query as ExportActivityParams;
          yield call(log.debug, 'exportActivity', activityId);
          let id: String | undefined = activityId;
          if (!activityId) {
            id = currentOrSelectedActivity(state)?.id;
          }
          if (activityId === '$selected') { // special case
            id = yield select((state: AppState) => state.options.selectedActivityId);
          }
          if (id) {
            const activity = yield call(database.activityById, id as string);
            if (activity) {
              response = yield call(exportActivity, activity);
            } else  {
              response = `activityId not found: ${id}`;
            }
          } else {
            response = 'no activityId';
          }
          break;
        }
        case 'flags': {
          response = state.flags;
          break;
        }
        case 'locs': {
          response = {
            userLocation: state.userLocation, // LocationEvent
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
          response = (path && path.mode && Array.from(path.mode)) || 'No path selected';
          break;
        }
        case 'ping': {
          response = 'pong'; // of course
          break;
        }
        case 'pulsars': {
          response = yield call(pulsars, state);
          break;
        }
        case 'samples': {
          response = state.samples; // This may be a large volume of data.
          break;
        }
        case 'selectedActivity': {
          let activity = yield call(selectedActivity, state);
          let results = [] as any;
          if (activity) {
            let modified = yield call(extendActivity, activity);
            results.push(modified);
            response = { results };
          }
          break;
        }
        case 'settings': {
          const settings = yield call(database.settings);
          response = {
            ...settings,
            pausedTime_: new Date(settings.pausedTime).toString(), // for human readability;
            updateTime_: new Date(settings.updateTime).toString(), // underscore at the end to keep alphabetic ordering
          }
          break;
        }
        case 'status': { // bunch of stuff bundled up
          const { cache } = state;
          response = {
            bounds: mapPosition(state),
            cache: {
              activityCount: cache.activities.length,
              populated: cache.populated || false,
              refreshCount: cache.refreshCount,
            },
            counts: { // TODO dry
              activities: (yield call(database.activities)).length,
              events: (yield call(database.events)).length,
              logs: (yield call(database.logs)).length,
              paths: (yield call(database.paths)).length,
              samples: state.samples.length,
              schemaVersion: constants.database.schemaVersion,
              timeSinceAppStartedUp,
              'utils.counts': yield call(utils.counts),
            },
            current: state.current,
            flags: state.flags,
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
      // reveal any performance issues / outliers
      const queryTime = ((yield call(utils.now)) as number) - queryStartTime;
      const appQueryResponse: AppQueryResponse = { response, queryTime, uuid };
      yield call(postToServer as any, 'push/appQueryResponse', { type: 'appQueryResponse', params: appQueryResponse });
    } catch (err) {
      try {
        const errorResponse: AppQueryResponse = { response: `Error: ${JSON.stringify(err)}`, uuid };
        yield call(postToServer as any, 'push/appQueryResponse', { type: 'appQueryResponse', params: errorResponse });
      } catch {
      } finally {
        yield call(log.error, 'appQuery', err);
      }
    }
  },

  // This exists so it can be used with yield take to wait for async stuff to finish, and doesn't do anything else.
  appStartupCompleted: function* (action: Action) {
    yield call(log.info, 'appStartupCompleted');
  },

  // State change here refers to activating or suspending the app.
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
    const now = (yield call(utils.now)) as number;
    const newAppStateChangeEvent = (newState: AppStateChange): AppStateChangeEvent => ({
      t: now,
      type: EventType.APP,
      newState,
    })
    yield put(newAction(AppAction.addEvents, { events: [newAppStateChangeEvent(newState)] }));
    const {
      recoveryMode,
      setPaceAfterStart,
      trackingActivity,
    } = yield select((state: AppState) => state.flags);

    if (activating) {
      if (trackingActivity) {
        // Follow user, and jump to NOW mode, when reactivating app while tracking.
        // TODO add flag to make these actions optional?
        yield put(newAction(AppAction.startFollowingUser));
        yield put(newAction(AppAction.jumpToNow));
      }
      // const count = yield call(Geo.countLocations); // TODO use count?
      if (!recoveryMode) {
        yield call(Geo.processSavedLocations); // Let's get this started ASAP.
      }
      yield call(Geo.setConfig, trackingActivity, false); // background false, meaning foreground
      if (setPaceAfterStart && trackingActivity) {
        yield call(Geo.changePace, true, () => {}); // manually set pace to moving when activating TODO review
      }
      const populated = yield select((state: AppState) => state.cache.populated);
      yield call(log.debug, 'cache has been populated:', populated);
      if (!populated) {
        yield put(newAction(AppAction.refreshCache));
      }
    } else { // not activating
      if (newState === AppStateChange.BACKGROUND || newState == AppStateChange.INACTIVE) {
        yield put(newAction(AppAction.setAppOption, { timestamp_background: utils.now() }))
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
    } catch (err) {
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
        const { center, heading, option, zoom } = params;
        if (center) {
          let newCenter = center;
          if (option === AbsoluteRelativeOption.relative) { // TODO what about relative with heading?
            const currentCenter = yield call(map.getCenter as any);
            yield call(log.trace, 'saga centerMap: currentCenter', currentCenter);
            newCenter = [currentCenter[0] + center[0], currentCenter[1] + center[1]];
          }
          if ((center[0] || center[1]) && haveUserLocation) {
            yield put(newAction(AppAction.stopFollowingPath)); // otherwise map may hop right back
            yield put(newAction(AppAction.stopFollowingUser)); // otherwise map may hop right back
          }
          if ((heading || zoom) && newCenter) { // optional in CenterMapParams; applies for both absolute and relative
            const config: CameraSettings = {
              animationDuration: constants.map.centerMapDuration,
              centerCoordinate: newCenter,
              heading: heading || 0,
              zoomLevel: zoom || 0,
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
      const { devMode, testMode } = yield select((state: AppState) => state.flags);
      if (devMode || testMode) { // No way should we do this on production version. With confirmation, if ever...
        yield call(log.warn, 'saga clearStorage on debug version of app - deleting all persisted data!');
        yield call(database.reset); // including Settings!
        yield call(Geo.destroyLocations);
        yield call(Geo.destroyLog);
        yield put(newAction(AppAction.refreshCache));
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
  // Note the use of startActivity here, but with the continueActivityId parameter set, which changes its behavior.
  continueActivity: function* (action: Action) {
    try {
      const params = action.params as ContinueActivityParams;
      const { activityId } = params;
      yield call(log.info, 'saga continueActivity', activityId);
      yield put(newAction(AppAction.startActivity, { continueActivityId: activityId }));
      yield put(newAction(AppAction.zoomToActivity, { id: activityId, zoomMap: true, zoomTimeline: true })); // in continueActivity
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
  deleteActivity: function* (action: Action) {
    try {
      const params = action.params as DeleteActivityParams;
      const { id } = params;
      const {
        currentActivityId,
        scrollTime,
        selectedActivityId,
      } = yield select((state: AppState) => state.options);
      const {
        deleteEventsWhenDeletingActivity,
      } = yield select((state: AppState) => state.flags);
      const deleteButton: AlertButton = {
        onPress: () => {
          log.info('Delete activity', id);
          if (id === currentActivityId) {
            log.warn('attempt to delete currentActivity (not permitted)');
            return;
          }
          if (id === selectedActivityId) {
            store.dispatch(newAction(AppAction.setAppOption, { selectedActivityId: null }));
          }
          store.dispatch(newAction(AppAction.refreshCachedActivity, { activityId: id, remove: true }));
          setTimeout(() => {
            database.deleteActivity(id, deleteEventsWhenDeletingActivity);
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
      const cancelButton: AlertButton = {
        onPress: () => {
          log.info('deleteActivity canceled');
        },
        text: 'Cancel',
        style: 'cancel',
      } // cancel is always on the left
      yield call(Alert.alert,
        'Delete selected activity?', 'This operation cannot be undone.', [deleteButton, cancelButton]);
    } catch (err) {
      yield call(log.error, 'saga deleteActivity', err);
    }
  },

  enableTestScenario: function* (action: Action) {
    const params = action.params as EnableTestScenarioParams;
    const { scenario } = params;
    log.debug('enableTestScenario:', scenario);
    const postPrep = interval.seconds(2); // time for prep actions to complete

    switch (scenario) {

      // At the moment there's only one automated test that is controlled from the JS side, for generating screenshots.
      case 'automate':
        const waitAwhile = interval.seconds(15);
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'reset' }));
        yield delay(postPrep);
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'load' }));
        yield delay(postPrep);
        yield put(newAction(AppAction.enableTestScenario, { scenario: '1' }));
        yield delay(waitAwhile);
        yield put(newAction(AppAction.enableTestScenario, { scenario: '2' }));
        yield delay(waitAwhile);
        yield put(newAction(AppAction.enableTestScenario, { scenario: '3' }));
        yield delay(waitAwhile);
        yield call(log.debug, 'Automated test complete');
        break;

      case 'reset':
        yield put(newAction(AppAction.clearStorage));
        break;

      case 'load': // sample data
        yield put(newAction(AppAction.reorientMap, { reorientationTime: 0 } ));
        const samples = (yield select((state: AppState) => state.samples)) as Array<ExportedActivity>;
        if (samples.length) {
          const { tStart } = samples[0].activity;
          if (tStart) {
            const now = (yield call(utils.now)) as number;
            const timeShift = (now - interval.hours(2)) - tStart; // TODO - make sample recent
            yield call(log.debug, 'timeShift', timeShift);
            for (const sample of samples) {
              yield put(newAction(AppAction.importActivity, { include: sample, timeShift }));
            }
            yield put(newAction(AppAction.refreshCache));
            yield put(newAction(AppAction.startFollowingUser));
            yield put(newAction(AppAction.scrollActivityList, { scrollTime: yield call(utils.now) }));
          } else {
            yield call(log.debug, 'cannot timeShift: tStart:', tStart);
          }
        } else {
            yield call(log.debug, 'no samples to import');
        }
        break;

      case 'moviePrep':
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'prep' }));
        yield delay(postPrep);
        yield put(newAction(AppAction.flagEnable, 'labelsEnabled'));
        yield put(newAction(AppAction.flagEnable, 'movieMode'));
        yield put(newAction(AppAction.flagDisable, 'requestedLocationPermission'));
        yield put(newAction(AppAction.flagEnable, 'showSequentialPaths'));
        yield put(newAction(AppAction.flagEnable, 'timelineNow'));
        yield call(Geo.stopBackgroundGeolocation); // to stop the background service so it doesn't auto-restart
        yield delay(postPrep);
        yield call(Alert.alert, 'To complete moviePrep, terminate the app and do Settings : General : Reset Location & Privacy.');
        break;

      case 'prep': {
          yield put(newAction(AppAction.flagEnable, 'colorizeActivities'));
          yield put(newAction(AppAction.flagDisable, 'labelsEnabled'));
          yield put(newAction(AppAction.flagDisable, 'helpOpen'));
          yield put(newAction(AppAction.flagDisable, 'settingsOpen'));
          yield put(newAction(AppAction.flagDisable, 'startMenuOpen'));
          yield put(newAction(AppAction.flagDisable, 'showSequentialPaths'));
          yield put(newAction(AppAction.flagDisable, 'topMenuOpen'));
          yield put(newAction(AppAction.stopFollowingPath));
          yield put(newAction(AppAction.stopFollowingUser));
          yield put(newAction(AppAction.reorientMap, { reorientationTime: 0 } ));
          const { opacity } = constants.map.default;
          yield put(newAction(AppAction.setAppOption, {
            mapOpacity: opacity,
            mapOpacityPreview: opacity,
            mapStyle: 'Satellite',
            timelineZoomValue: constants.timeline.default.zoomValue,
          }))
          yield delay(postPrep);
        }
        break;

      case '1': { // as in, step 1
          yield put(newAction(AppAction.enableTestScenario, { scenario: 'prep' }));
          yield delay(postPrep);
          const sampleId1 = "a2bf3cc8-f12e-46f1-b3d4-a83654d8eec1";
          yield call(log.debug, 'scenario 1');
          yield put(newAction(AppAction.flagEnable, 'labelsEnabled'));
          const { opacity } = constants.map.default;
          yield put(newAction(AppAction.setAppOption, {
            grabBarSnapIndex: 2,
            grabBarSnapIndexPreview: 2,
            mapOpacity: opacity,
            mapOpacityPreview: opacity,
            mapStyle: 'Satellite',
          }))
          yield put(newAction(AppAction.selectActivity, {
            id: sampleId1,
            proportion: 0.5,
          }))
          yield put(newAction(AppAction.zoomToActivity, {
            id: sampleId1,
            zoomMap: true,
            zoomTimeline: true,
          }))
        }
        break;

      case '2':
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'prep' }));
        yield delay(postPrep);
        const sampleId2 = "c5b6c70f-26a5-4403-a40d-9796973f911f";
        yield call(log.debug, 'scenario 2');
        yield put(newAction(AppAction.selectActivity, {
          id: sampleId2,
          proportion: 0.8,
        }))
        yield put(newAction(AppAction.flagEnable, 'showSequentialPaths'));
        yield put(newAction(AppAction.startFollowingPath));
        yield put(newAction(AppAction.setAppOption, {
          grabBarSnapIndex: 6,
          grabBarSnapIndexPreview: 6,
          mapOpacity: 0.3,
          mapOpacityPreview: 0.3,
          mapStyle: 'Satellite',
        }))
        break;

      case '3':
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'prep' }));
        yield delay(postPrep);
        yield call(log.debug, 'scenario 3');
        yield put(newAction(AppAction.setAppOption, {
          grabBarSnapIndex: 1,
          grabBarSnapIndexPreview: 1,
          mapOpacity: 1,
          mapOpacityPreview: 1,
          mapStyle: 'Trails',
          scrollTime: yield call(utils.now),
        }))
        yield put(newAction(AppAction.centerMap, {
          center: [ -122.64707782213318, 48.406072004409396 ],
          heading: 330,
          option: 'absolute',
          zoom: 14.385161869876807,
        }))
        break;

      default:
        yield call(log.warn, 'enableTestScenario: scenario unknown');
        break;
    }
  },

  // After-effects (i.e. downstream side effects) of modifying app flags are handled here.
  flag_sideEffects: function* (flagName: string) {
    const { flags, options } = yield select((state: AppState) => state);
    const enabledNow = flags[flagName];
    const { appStartupCompleted, requestedLocationPermission } = flags;
    const { introModePage, pausedTime, viewTime } = options;
    // Avoid changing settings during startup (instead, we apply previous.)
    if (appStartupCompleted) {
      // Persist persistedFlags in Settings.
      if (persistedFlags.includes(flagName)) {
        yield call(database.changeSettings, { [flagName]: enabledNow }); // Note usage of computed property name.
      }
      if (flagName === 'introMode') {
        yield put(newAction(AppAction.setAppOption, { grabBarSnapIndex: 1, grabBarSnapIndexPreview: 1 }));
        if (enabledNow) {
          yield put(newAction(AppAction.setAppOption, { introModePage })); // TODO doing this for the option side effect
        } else {
          if (!requestedLocationPermission) {
            // This handles the case of requesting location permission on a manual early exit from introMode.
            // In the natural course of things, the request is made earlier, just after viewing the Privacy page.
            yield put(newAction(AppAction.requestLocationPermission));
            yield put(newAction(AppAction.startFollowingUser));
          }
        }
      }
      if (flagName === 'timelineNow') {
        if (enabledNow) { // this means we just enabled it
          const now = yield call(utils.now);
          const setOptions = { centerTime: now } as any;
          if (Math.abs(viewTime - pausedTime) > constants.timing.timelineCloseToNow) {
            setOptions.pausedTime = viewTime;
          }
          if (!flags.activityListScrolling && !flags.timelineScrolling) {
            yield put(newAction(AppAction.setAppOption, setOptions));
            yield put(newAction(AppAction.timerTick, now));
          } // TODO else?
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

  // Note these flag sagas are the way to toggle flags in state.flags.

  flagDisable: function* (action: Action) {
    const flagName: string = action.params;
    const flags = yield select((state: AppState) => state.flags);
    if (flags[flagName]) {
      yield put(newAction(ReducerAction.FLAG_DISABLE, flagName));
      yield sagas.flag_sideEffects(flagName);
      yield call(log.trace, 'saga flagDisable', flagName);
    }
  },

  flagEnable: function* (action: Action) {
    const flagName: string = action.params;
    const flags = yield select((state: AppState) => state.flags);
    if (!flags[flagName]) {
      yield put(newAction(ReducerAction.FLAG_ENABLE, flagName));
      yield sagas.flag_sideEffects(flagName);
      yield call(log.trace, 'saga flagEnable', flagName);
    }
  },

  flagToggle: function* (action: Action) {
    const flagName: string = action.params;
    yield put(newAction(ReducerAction.FLAG_TOGGLE, flagName));
    yield call(log.trace, 'saga flagToggle', flagName);
    yield sagas.flag_sideEffects(flagName);
  },

  // Update state.current, state.userLocation, and re-center the map if needed, in response to geolocation events.
  // (TODO If these events are old or known to be semi-inaccurate, do we still want to do that?)
  // Commmon to, and downstream from, both the background-geolocation plugin as well as location simulation scenarios.
  // Note it is not the responsibility of this saga to add events when locations come in.
  // That is done with AppAction.addEvents in Geo.onLocation and Geo.onSimulateLocation.
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
      yield put(newAction(ReducerAction.SET_CURRENT, current)); // this sets state.current

      const previousUserLocation = yield select((state: AppState) => state.userLocation);
      yield put(newAction(ReducerAction.GEOLOCATION, geoloc)); // this sets state.userLocation

      const { mapMoving } = yield select((state: AppState) => state.flags);
      if (recheckMapBounds && !mapMoving) {
        const appActive = yield select((state: AppState) => state.flags.appActive);
        if (appActive) {
          // Potential cascading AppAction.centerMapOnUser:
          const map = MapUtils();
          if (map) {
            const { centerMapContinuously, followingUser } = yield select((state: AppState) => state.flags);
            const bounds = yield call(map.getVisibleBounds);
            if (followingUser) {
              const { lat, lon } = locationEvent;
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
      const now = (yield call(utils.now)) as number + constants.timing.timelineCloseToNow; // TODO justify fudge factor
      yield put(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in jumpToNow
      yield put(newAction(AppAction.scrollTimeline, { scrollTime: now })); // in jumpToNow
      yield put(newAction(AppAction.flagEnable, 'timelineNow'));
    }
  },

  importActivity: function* (action: Action) {
    try {
      const params = action.params as ImportActivityParams;
      const { include, timeShift } = params;
      const { activity, path } = include;
      const { id } = activity;
      const pathLengths = { // just for logging
        ele: path.ele.length,
        lats: path.lats.length,
        lons: path.lons.length,
        mode: path.mode.length,
        odo: path.odo.length,
        speed: path.speed.length,
        t: path.t.length,
      }
      yield call(log.info, 'importActivity', activity, pathLengths);

      // Guard against importing an activityId already in use.
      const existingActivity = yield call(database.activityById, id);
      if (existingActivity) {
        // TODO let's permit a time-adjusted activity to overwrite an old one so it's easier for tests to be idempotent.
        yield call(log.warn, 'importActivity: activityId already exists', id);
      }
      let shiftedActivity = activity;
      let shfitedPath = path;
      if (timeShift) {
        shiftedActivity = { ...activity };
        for (const prop of ActivityTimeProps) {
          shiftedActivity[prop] += timeShift;
        }
        shfitedPath = { ...path };
        const newt = [] as Array<number>;
        for (const t of shfitedPath.t) {
          newt.push(t + timeShift);
        }
        shfitedPath.t = newt;
      }
      yield call(database.updateActivity, shiftedActivity, shfitedPath);
      yield call(log.debug, 'imported');
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
    } catch (err) {
      // eat it
    }
  },

  // Triggered by Mapbox
  mapRegionChanged: function* (action: Action) {
    const mapRegionUpdate = action.params as MapRegionUpdate;
    yield call(log.trace, 'mapRegionChanged', mapRegionUpdate);
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
    } catch (err) {
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
      const eventsForActivity = (yield call(database.eventsForActivity, id)) as Events;
      const { currentActivityId } = yield select((state: AppState) => state.options);
      const { schemaVersion } = constants.database;
      const activityUpdate: ActivityData = { id, schemaVersion };
      const pathUpdate = (yield call(database.newPathUpdate, id)) as PathUpdate;
      activityUpdate.count = eventsForActivity.length;
      let prevLocEvent: LocationEvent | null = null;
      let tStart = 0;
      let latestLocEvent: LocationEvent | null = null;
      let modeNumeric = 0;
      for (const e of eventsForActivity) { // Loop through all the events. events are already sorted by time.
        const event = e as any as GenericEvent;
        const { type } = event;
        if (type === EventType.LOC) {
          latestLocEvent = event as LocationEvent;
          if (prevLocEvent && latestLocEvent.t === prevLocEvent!.t) {
            // log.trace('refreshActivity: ignoring t =', event.t);
            continue; // ignore consecutive LOC events with identical timestamp
          }
        }
        if (type == EventType.MODE) {
          const {
            mode,
            confidence,
          } = event as ModeChangeEvent;
          modeNumeric = (confidence && mode) ? modeChangeToNumber({ confidence, mode }) : 0;
        }
        // log.trace('refreshActivity event', e.toJSON());
        if (latestLocEvent && (type === EventType.LOC || type === EventType.MODE)) {
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
            continue;
          }
          if (!accuracy || accuracy <= constants.paths.metersAccuracyRequired) { // if sufficiently accurate
            // ele
            pathUpdate.ele.push(ele || constants.paths.elevationUnavailable);
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
            pathUpdate.odo.push(odo || 0); // TODO || 0
            if (odo) {
              activityUpdate.odo = Math.max(activityUpdate.odo || -Infinity, odo);
              activityUpdate.odoStart = Math.min(activityUpdate.odoStart || Infinity, odo);
            }
            // speed
            pathUpdate.speed.push(speed || 0); // TODO || 0
            // t
            pathUpdate.t.push(t);
          }
          activityUpdate.tFirstLoc = Math.min(activityUpdate.tFirstLoc || t, t);
          activityUpdate.tLastLoc = Math.max(activityUpdate.tLastLoc || 0, t); // max redundant when events sorted by t
          activityUpdate.tLastRefresh = utils.now(); // TODO was: yield call(utils.now); but that yields crash in Realm!
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
        } else if (event.type === EventType.MARK && event.t) {
          const markEvent = event as MarkEvent;
          if (markEvent.subtype === MarkType.START) {
            tStart = event.t;
            activityUpdate.tStart = event.t;
          }
          if (markEvent.subtype === MarkType.END) {
            activityUpdate.tEnd = event.t;
          }
        }
        activityUpdate.tLastUpdate = Math.max(activityUpdate.tLastLoc || 0, activityUpdate.tEnd || 0);
      }
      log.trace('refreshActivity: done with events');
      if (tStart) { // only if we saw a START mark
        if (id !== currentActivityId && !activityUpdate.tEnd && activityUpdate.tLastUpdate) {
          // This only happens if the END MARK event did not get properly inserted.
          activityUpdate.tEnd = activityUpdate.tLastUpdate;
        }
        yield call(database.updateActivity, activityUpdate, pathUpdate);
      }
      yield call(utils.addToCount, 'refreshedActivities');
    } catch (err) {
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
      for (const id of activityIds.kept) {
        yield put(newAction(AppAction.refreshActivity, { id })); // initiate activity refresh
        yield take(AppAction.refreshActivityDone); // wait for it to finish
        // TODO could pause here
        count++;
        yield call(log.trace, 'refreshAllActivities: refreshActivityDone', count, id);
      }
    }
  },

  // This refers to the cache of Activities, state.cache, which is a POJO array used to populate the ActivityList that
  // doesn't require doing similar database operations repeatedly. That might not be terrible if Realm is super
  // optimized, but it'll never match an in-memory JS cache. This operation is not expensive; there's no path traversal.
  refreshCache: function* (action: Action) {
    try {
      yield call(log.info, 'saga refreshCache');
      const timestamp = yield call(utils.now);
      const realmActivities = yield call(database.activities); // These are sorted by tStart.
      const activitiesAsArray = Array.from(realmActivities) as ActivityData[]
      const activities = extendedActivities(activitiesAsArray);
      const refreshCount = (yield select((state: AppState) => state.cache.refreshCount)) + 1;
      yield put(newAction(AppAction.cache, { activities, populated: true, refreshCount }));
      const now = yield call(utils.now);
      yield call(log.debug, 'new refreshCount', refreshCount, 'msec', now - timestamp, 'count', activities.length);
      yield put(newAction(AppAction.refreshCacheDone));
    } catch (err) {
      yield call(log.error, 'saga refreshCache', err);
    }
  },

  refreshCacheDone: function* (action: Action) {
    // Used with yield take
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

  // This is a low-impact (nothing persistent), cache-only action that "re-extends" any currentActivity so the time-
  // based calculations are correct whether or not there is any new location data coming in.
  refreshCachedCurrentActivity: function* (action: Action) {
    const state = yield select((state: AppState) => state);
    const cca = yield call(currentCachedActivity, state);
    if (cca) {
      yield put(newAction(AppAction.refreshCachedActivity, { activityId: cca.id }));
    }
  },

  // Set map bearing to 0 (true north) typically in response to user action (button).
  reorientMap: function* (action: Action) {
    const params = action.params as ReorientMapParams;
    const map = MapUtils();
    const animationDuration = params?.reorientationTime || constants.map.reorientationTime;
    if (map) {
      yield call(log.debug, 'saga reorientMap');
      yield put(newAction(AppAction.flagEnable, 'mapMoving'));
      yield put(newAction(AppAction.flagEnable, 'mapReorienting'));
      const obj = { heading: 0, animationDuration };
      map.setCamera(obj);
    }
  },

  // See sequence saga. This looks like a no-op; the saga is, because it needs to exist, but the action is still useful.
  repeatedAction: function* () {
  },

  requestLocationPermission: function* (action: Action) {
    const params = action.params as RequestLocationPermissionParams;
    const { requestedLocationPermission, testMode } = yield select((state: AppState) => state.flags);
    if (testMode) {
      yield call(log.debug, 'testMode true, bypassing requestedLocationPermission');
      yield put(newAction(AppAction.flagEnable, 'requestedLocationPermission')); // Let's not, and say we did.
    } else {
      if (requestedLocationPermission) {
        yield call(log.debug, 'requestedLocationPermission already');
      } else {
        const authStatus = yield call(Geo.requestPermission); // TODO store in options so can query later?
        yield call(log.info, 'requestLocationPermission authStatus', authStatus);
        yield put(newAction(AppAction.flagEnable, 'requestedLocationPermission'));
        yield call(Geo.initializeGeolocation, store, false); // false: not tracking
        yield call(Geo.startBackgroundGeolocation);
      }
    }
    if (params && params.onDone) {
      yield call(params.onDone);
    }
  },

  restartApp: function* () {
    const { devMode } = yield select((state: AppState) => state.flags);
    if (devMode) {
      yield call(log.warn, 'saga restartApp');
      yield call(log.info, RNRestart);
      yield call(RNRestart.Restart);
    }
  },

  scrollActivityList: function* (action: Action) {
    yield call(log.scrollEvent, 'saga scroll scrollActivityList');
    const params = action.params as ScrollActivityListParams;
    const { flags, options } = (yield select((state: AppState) => state)) as AppState;
    const now = (yield call(utils.now)) as number;
    const scrollTime = params.scrollTime || (flags.timelineNow ? now : options.scrollTime); // fallback
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
  // is done in the general case of simply scrolling the Timeline or ActivityList.
  //
  // If proportion is not provided, the intent is to cycle thus: from tLast --> tStart --> midpoint --> tLast ...
  // each time this saga is run.
  //
  // This is intended for most intentional type of selection, configuring the app UI to focus on a specific activity.
  selectActivity: function* (action: Action) {
    try {
      const params = action.params as SelectActivityParams;
      const { follow, id } = params;
      yield call(log.debug, 'saga selectActivity', id);
      const state = yield select((state: AppState) => state);
      const activity = yield call(cachedActivity, state, id);
      if (activity) {
        yield call(log.debug, 'saga selectActivity: activity found', id);
        yield put(newAction(AppAction.zoomToActivity, {
          id: activity.id,
          zoomTimeline: true,
          zoomMap: true,
        }))
        let proportion = params.proportion;
        if (!proportion) {
          const { scrollTime } = state.options;
          if (scrollTime === activity.tStart) {
            proportion = 0.5;
          } else if (scrollTime === activity.tLast) {
            proportion = 0;
          } else {
            proportion = 1; // default
          }
        }
        log.trace('proportion', proportion);
        const newTime = activity.tStart + (activity.tLast - activity.tStart) * proportion
        if (activity.tEnd) {
          // Pressing some prior activity.
          yield put(newAction(AppAction.flagDisable, 'timelineNow'));
          yield put(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in selectActivity
        } else {
          // Pressing the currentActivity.
          log.debug('selectActivity: Pressing the currentActivity', new Date(newTime).toString());
          if (newTime === activity.tLast) {
            yield put(newAction(AppAction.flagEnable, 'timelineNow'));
          }
        }
        // TODO review. Probably works best to ignore incoming timelineNow mode in selectActivity. */
        /* if (!state.flags.timelineNow) */ {
          const appOptions = {
            centerTime: newTime, // TODO is it necessary to set this here?
            scrollTime: newTime,
            selectedActivityId: activity.id,
            viewTime: newTime,
          }
          log.debug('selectActivity setting appOptions', appOptions);
          yield put(newAction(AppAction.setAppOption, appOptions));
          if (follow) {
            if (activity.tEnd) { // prior activity
              yield put(newAction(AppAction.startFollowingPath));
            } else { // current activity
              const now = yield call(utils.now);
              yield put(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in selectActivity
              yield put(newAction(AppAction.flagEnable, 'timelineNow'));
              yield put(newAction(AppAction.startFollowingUser));
            }
          }
        }
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
        for (const sequenceAction of sequenceActions) {
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

  // This is the mechanism that should be used to modify state.options.
  // That happens right away, and all the rest is side effects.
  setAppOption: function* (action: Action) {
    // First, actually set the options!
    const { params } = action;
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));

    // Next, handle option side effects:
    const state: AppState = yield select((state: AppState) => state);
    const {
      activityListScrolling,
      appStartupCompleted,
      introMode,
      timelineNow,
      timelineScrolling,
    } = state.flags;
    if (!appStartupCompleted) {
      yield call(log.trace, 'setAppOption: app has not finished starting up, so skipping side-effects');
      return;
    }
    if (introMode && params.introModePage) {
      const activity = currentOrSelectedActivity(state);
      if (activity) {
          const page = introPages[params.introModePage];
          if (page.zoomsToActivity) {
            yield delay(constants.timing.delayBeforeUsingNewMap); // Allow time for map to show up if it's being un-hidden.
            yield put(newAction(AppAction.zoomToActivity, {
              id: activity.id,
              zoomMap: true,
              zoomTimeline: true,
            }))
          }
      }
    }
    // An important side effect: Whenever viewTime is set, pausedTime may also be updated.
    // Note that setting scrollTime (which changes as the Timeline is scrolled) lacks these side effects.
    // Note that the AppAction.setAppOption within this block recurses back into this saga, but only one level deep.
    if (params.viewTime !== undefined) {
      const t = params.viewTime;
      if (!timelineNow) {
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
    for (const propName of persistedOptions) {
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

  // Simulate a location update, if needed, based on the exportedActivity indicated by state.options.locationSimulation.
  simulateLocation: function* (action: Action) {
    try {
      const params = action.params as SimulateLocationParams || {};
      const state = (yield select(state => state)) as AppState;
      // startTime is the clock time when this simulation started.
      const { activityId, startTime } = state.options.locationSimulation;
      if (activityId && startTime) {
        const now = (yield call(utils.now)) as number;
        if (now >= startTime) {
          const exportedActivity = state.cache.exportedActivities[activityId];
          if (exportedActivity) {
            const { activity, path } = exportedActivity;
            // It's reasonable to insist an activity must have started before any simulation based on it.
            if (activity && activity.tStart && activity.tStart <= startTime) {
              const timeShift = startTime - activity.tStart;
              // Now we can just add timeShift to any timepoint we see in the activity itself or in the path.t array
              // to convert from the exportedActivity's timeframe to the current timeframe.
              let latestIndex: number | undefined = undefined;
              let latestTimepoint: number | undefined = undefined;
              for (let i = 0; i < path.t.length; i++) {
                const t = path.t[i] + timeShift;
                if (t > now) {
                  break;
                }
                latestIndex = i;
                latestTimepoint = t;
              }
              // Done scanning path.
              if (latestIndex !== undefined && latestTimepoint && (latestTimepoint !== state.current.t)) {
                const ele = path.ele[latestIndex];
                const lat = path.lats[latestIndex];
                const lon = path.lons[latestIndex];
                const mode = numberToModeType(path.mode[latestIndex]);
                const odo = path.odo[latestIndex];
                const speed = path.speed[latestIndex];
                const t = latestTimepoint;
                const locationInfo: LocationInfo = {
                  ele,
                  lat,
                  lon,
                  mode,
                  odo,
                  speed,
                  t,
                }
                yield call(Geo.onSimulateLocation, locationInfo, state);
              }
            }
          }
        }
      }
    } catch (err) {
      yield call(log.error, 'saga simulateLocation', err);
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
        const now = yield call(utils.now);
        let activityId: string;
        if (continueActivityId) {
          // should already have the AppUserActionEvent and MarkEvent from before; just set currentActivityId.
          activityId = continueActivityId;
        } else {
          yield put(newAction(AppAction.flagDisable, 'mapTapped'));
          const followingNow = yield select((state: AppState) => state.flags.followingUser);
          if (!followingNow) {
            yield put(newAction(AppAction.startFollowingUser));
          }
          const newActivity = yield call(database.createActivity, now);
          activityId = newActivity.id;
          const startEvent: AppUserActionEvent = {
            ...timeseries.newEvent(now, activityId),
            type: EventType.USER_ACTION,
            userAction: AppUserAction.START,
          }
          const startMark: MarkEvent = {
            ...timeseries.newEvent(now, activityId),
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
        const scrollTime = yield call(utils.now);
        yield put(newAction(AppAction.scrollActivityList, { scrollTime })); // in startActivity
        if (!continueActivityId) {
          yield delay(0); // TODO review: At one point this was added for a race condition. Is it necessary?
          yield put(newAction(AppAction.flagEnable, 'timelineNow'));
        }
      }
    } catch (err) {
      yield call(log.error, 'saga startActivity', err);
    }
  },

  // As with stopSimulatingLocation, this is only for test and dev scenarios.
  startSimulatingLocation: function* (action: Action) {
    try {
      yield call(log.debug, `saga startSimulatingLocation`);
      const params = action.params as StartSimulatingLocationParams || {};
      const { activityId } = params;
      const { cache } = (yield select((state: AppState) => state)) as AppState;
      let extendedActivity = cache.exportedActivities[activityId];
      if (extendedActivity) {
        yield call(log.debug, `saga startSimulatingLocation: cache hit for ${activityId}`);
      } else {
        const activity = cache.activities.find(activity => activity.id === activityId);
        if (activity === undefined) {
          yield call(log.warn, `saga startSimulatingLocation: no cache hit for ${activityId}`);
          return; // early return
        } else {
          extendedActivity = yield call(exportActivity, activity);
          // Note use of computed key [activityId]
          yield put(newAction(AppAction.cache, { exportedActivities: { [activityId]: extendedActivity }}));
        }
      }
      const locationSimulation: LocationSimulationOptions = {
        activityId, // should be in the cache
        startTime: yield call(utils.now),
      }
      yield put(newAction(AppAction.setAppOption, { locationSimulation }));

      // just for debugging
      yield delay(1000); // otherwise the cache may not be populated yet
      const state = (yield select(state => state)) as AppState;
      yield call(log.debug, 'cache.exportedActivities', Object.keys(state.cache.exportedActivities));
    } catch (err) {
      yield call(log.error, 'saga startSimulatingLocation', err);
    }
  },

  // As with startSimulatingLocation, this is only for test and dev scenarios.
  stopSimulatingLocation: function* (action: Action) {
    try {
      const params = action.params as StopSimulatingLocationParams || {};
      yield put(newAction(AppAction.setAppOption, { locationSimulation: { activityId: '', startTime: 0 }}));
    } catch (err) {
      yield call(log.error, 'saga stopSimulatingLocation', err);
    }
  },
  
  // This saga is run when the app first starts up, and also when it is restarted after being suspended/terminated.
  // The app may be restarted in the background if tracking an activity and the user has moved beyond a geofence around
  // the last location before the app was terminated. The app may also be restarted manually after having been
  // terminated. If the app is restarted while tracking an activity, continueActivity is invoked.
  startupActions: function* (action: Action) {
    try {
      const params = action.params as StartupActionParams || {};
      const { include } = params; // used to import sample data for UI testing

      const runningInBackgroundNow = utils.appInBackground();
      yield call(database.completeAnyMigration);
      const {
        automate,
        devMode,
        recoveryMode,
        showIntroIfNeeded,
        testMode,
      } = yield select((state: AppState) => state.flags);
      yield call(log.debug, 'saga startupActions');

      // Restore app options from settings
      const settings = (yield call(database.settings)) as SettingsObject;
      yield call(log.info, 'Saved App settings', settings);
      const newSettings = {} as any;
      for (const propName of persistedOptions) {
        if (settings[propName] !== undefined) {
          newSettings[propName] = settings[propName];
        }
      }
      const propagatedSettings = {} as any; // TODO use the type of AppState options
      if (newSettings.mapOpacity) { // special case
        propagatedSettings.mapOpacityPreview = newSettings.mapOpacity;
      }
      if (newSettings.pausedTime) {
        propagatedSettings.centerTime = newSettings.pausedTime;
        propagatedSettings.scrollTime = newSettings.pausedTime;
        propagatedSettings.viewTime = newSettings.pausedTime;
      }
      if (Object.entries(newSettings).length) {
        yield call(log.debug, 'Reading settings from database', newSettings);
        yield put(newAction(AppAction.setAppOption, { ...newSettings, ...propagatedSettings }));
      }
      // Restore app flags from settings
      for (const propName of persistedFlags) {
        if (settings[propName] !== undefined) {
          const actionType = (settings[propName] ? AppAction.flagEnable : AppAction.flagDisable);
          yield put(newAction(actionType, propName)); // TODO any reason not to set these all at once?
        }
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
        movieMode,
        remoteDebug,
        requestedLocationPermission,
        timelineNow,
      } = settings;
      const bounds = [[lonMax, latMax], [lonMin, latMin]];

      // Set initial map bounds, heading and zoomLevel
      yield put(newAction(ReducerAction.MAP_REGION, { bounds, heading: mapHeading, zoomLevel: mapZoomLevel }));
      yield call(log.debug, `startupActions: initial map bounds ${bounds}, heading ${mapHeading} zoom ${mapZoomLevel}`);
      yield put(newAction(AppAction.flagEnable, 'mapEnable'));

      // Configure the grabBar
      const grabBarSnapIndexPreview = grabBarSnapIndex; // duplicate the current setting
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
      if (!testMode) {
        yield call(log.debug, `startupActions: !testMode`);
        if (requestedLocationPermission && !movieMode) {
          const launchedInBackground = yield call(Geo.initializeGeolocation, store, tracking);
          yield call(log.debug, `startupActions: launchedInBackground ${launchedInBackground}`);
          yield call(Geo.startBackgroundGeolocation);
        } else if (showIntroIfNeeded) { // auto-launch introMode if we have not yet requestedLocationPermission
          yield call(log.debug, `startupActions: showIntroIfNeeded is true. Enabling introMode.`);
          yield put(newAction(AppAction.flagEnable, 'introMode'));
        }
      }
      if (!recoveryMode) {
        if (!runningInBackgroundNow) {
          yield put(newAction(AppAction.refreshCache));
          yield take(AppAction.refreshCacheDone); // This shouldn't take long. Simpler to have it out of the way.
        }
        if (tracking) {
          yield call(log.info, 'Continuing previous activity...');
          yield put(newAction(AppAction.continueActivity, { activityId: currentActivityId })); // this will follow user
        }
      }
      // Now that we are through all the startup actions, ready to change appState from STARTUP to ACTIVE or BACKGROUND.
      const newState = runningInBackgroundNow ? AppStateChange.BACKGROUND : AppStateChange.ACTIVE;
      yield put(newAction(AppAction.appStateChange, { manual: true, newState }));

      if (include) {
        yield put(newAction(ReducerAction.SET_SAMPLES, include));
      }
      if (automate) {
        yield put(newAction(AppAction.enableTestScenario, { scenario: 'automate' })); // may rely on SET_SAMPLES
      } else {
        const scrollTime = (timelineNow && pausedTime) ? yield call(utils.now) : pausedTime;
        const populated = yield select((state: AppState) => state.cache.populated);
        if (!populated) {
          yield put(newAction(AppAction.refreshCache));
          yield take(AppAction.refreshCacheDone); // You can't expect to scroll a list based on a non-existent cache...
        }
        yield put(newAction(AppAction.scrollActivityList, { scrollTime })); // in startupActions
      }
      yield put(newAction(AppAction.completeAppStartup));
      yield take(AppAction.appStartupCompleted); // wait for state flag to be enabled (TODO still needed?)

      // After appStartupCompleted, we are able to persist changes to Settings.
      if (devMode || remoteDebug || testMode) {
        // In devMode, attempt to stay in regular contact with the Pathify server.
        // Set and persist clientId for this app if needed.
        if (!settings.clientId || !settings.clientId.length) {
          const clientId = uuidv4();
          yield put(newAction(AppAction.setAppOption, { clientId }));
        }
        yield call(log.debug, `startupActions: devMode ${devMode}, remoteDebug ${remoteDebug}, polling server`);
        yield call(setTimeout as any, pollServer, 0); // pollServer requires clientId. setTimeout has weird type error.
      }
    } catch (err) {
      yield call(log.error, 'startupActions exception', err);
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

  stopActivity: function* () {
    try {
      const { refreshActivityOnStop, trackingActivity } = yield select((state: AppState) => state.flags);
      if (trackingActivity) {
        yield put(newAction(AppAction.flagDisable, 'trackingActivity'));
        yield call(Vibration.vibrate, constants.timing.vibration);
        const activityId = yield select((state: AppState) => state.options.currentActivityId);
        const now = (yield call(utils.now)) as number;
        const stopEvent: AppUserActionEvent = {
          ...timeseries.newEvent(now, activityId),
          type: EventType.USER_ACTION,
          userAction: AppUserAction.STOP,
        }
        const endMark: MarkEvent = {
          ...timeseries.newEvent(now, activityId),
          type: EventType.MARK,
          subtype: MarkType.END,
        }
        yield put(newAction(AppAction.addEvents, { events: [stopEvent, endMark] }));
        const activity = yield call(database.activityById, activityId);
        yield call(log.debug, 'stopActivity', extendActivity(activity));
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
        yield put(newAction(AppAction.setAppOption,
          { currentActivityId: null, selectedActivityId: activityId, scrollTime: now, viewTime: now }));
        yield put(newAction(AppAction.zoomToActivity, { id: activity.id, zoomMap: true, zoomTimeline: true })); // in stopActivity
        yield put(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in stopActivity
        if (refreshActivityOnStop) {
          yield put(newAction(AppAction.refreshActivity, { id: activity.id }));
        }
      }
    } catch (err) {
      yield call(log.error, 'saga stopActivity', err);
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
        log.scrollEvent('timelineRelativeZoom', newZoom);
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
      const now = (yield call(utils.now)) as number;
      if (scrollTime < now - constants.timing.timelineCloseToNow) {
        yield put(newAction(AppAction.flagDisable, 'timelineNow'));
      }
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
    const state = (yield select((state: AppState) => state)) as AppState;
    const {
      appActive,
      followingPath,
      mapReorienting,
      timelineNow,
      timelineScrolling,
    } = state.flags;
    if (appActive) { // avoid ticking the timer in the background
      const now = action.params as number; // note that 'now' is a parameter here. It need not be the real now.
      const nowTimeRounded = Math.floor(now / 1000) * 1000;
      if (nowTimeRounded === state.options.nowTimeRounded) {
        // Most of the time, only this happens.
        // TODO if it's basically only for smooth motion of the second hands on the clock that we do this more than once
        // per second, maybe there's a lighter-weight solution that bypasses this semi-expensive AppAction.setAppOption,
        // which can't help but yield a whole cascade of downstream effects with react-redux that will add up.
        yield put(newAction(AppAction.setAppOption, { nowTime: now }));
      } else {
        // But when nowTimeRounded bumps up to the next whole second, we do this:
        yield put(newAction(AppAction.refreshCachedCurrentActivity)); // TODO review. Should be lightweight.
        const options = { nowTime: now, nowTimeRounded } as any; // always update nowTime
        if (timelineNow) {
          options.scrollTime = now;
          if (!timelineScrolling) { // because if timelineScrolling, user's actions are more important
            options.viewTime = now;
          }
        }
        if (state.options.locationSimulation.activityId) {
          yield put(newAction(AppAction.simulateLocation, { }));
        }
        yield put(newAction(AppAction.setAppOption, options));

        // Possibly re-center map as well.
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

  topButtonPressed: function* (action: Action) {
    const state = yield select((state: AppState) => state);
    const { grabBarSnapIndex, selectedActivityId } = state.options;
    const snapIndexMinimum = constants.snapIndex.activityList; // Ensure at least this is shown.
    // TODO for now, no actual menu opens unless there is a selected activity, because it would serve no purpose.
    if (selectedActivityId !== null) {
      yield put(newAction(AppAction.closePanels, { option: 'otherThanTopMenu' }));
      yield put(newAction(AppAction.flagToggle, 'topMenuOpen'));
    }
    // Ensure the ActivityList is shown, in order to see which activity would be affected by the menu.
    // That enables the selection of an activity which the topMenu would then act on. The Timeline will also be shown.
    if (grabBarSnapIndex < snapIndexMinimum) {
      yield put(newAction(AppAction.setAppOption, {
        grabBarSnapIndex: snapIndexMinimum,
        grabBarSnapIndexPreview: snapIndexMinimum,
      }))
    }
  },

  // Stop following user after panning the map -- unless the map was moved only slighly and the user is still in bounds.
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
        let { latMax, latMin, lonMax, lonMin } = activity;
        yield call(log.trace, 'saga zoomToActivity',
          { latMax, latMin, lonMax, lonMin, zoomMap, zoomTimeline });
        if (!state.flags.mapRendered) {
          yield call(log.info, 'saga zoomToActivity: waiting for mapRendered');
          yield take(AppAction.mapRendered);
        }
        if (latMax !== undefined && latMin !== undefined && lonMax !== undefined && lonMin !== undefined) {
          // Enlarge bounds so we don't zoom too far in when just starting out.
          const rangeMin = state.options.minLatOrLonZoomRange;
          if (Math.abs(latMax - latMin) < rangeMin || Math.abs(latMax - latMin) < rangeMin) {
            const latMid = (latMin + latMax) / 2;
            const lonMid = (lonMin + lonMax) / 2;
            latMin = latMid - rangeMin/2;
            latMax = latMid + rangeMin/2;
            lonMin = lonMid - rangeMin/2;
            lonMax = lonMid + rangeMin/2;
            yield call(log.trace, 'saga zoomToActivity - expanded bounds',
              { latMax, latMin, lonMax, lonMin, zoomMap, zoomTimeline });
          }
          map.fitBounds([lonMax, latMax], [lonMin, latMin], mapPadding(state), duration);
          yield call(log.trace, 'saga zoomToActivity: did fitBounds');
        }
      }
      if (zoomTimeline) {
        // Zoom Timeline to show the entire activity, in context. Note we are not resetting its viewTime, just zooming.
        // If there is no tTotal yet (which is the case for a currentActivity), we use the current now time as the end.
        const now = (yield call(utils.now)) as number;
        const tTotal = activity.tTotal || (now - activity.tStart);
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
