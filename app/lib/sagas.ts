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
  Alert,
  AlertButton,
} from 'react-native';
import { Polygon } from '@turf/helpers';
import RNRestart from 'react-native-restart';
import {
  call,
  delay,
  put,
  select,
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

  AddEventsParams,
  AppStateChangeParams,
  CenterMapParams,
  ClockPressParams,
  ClosePanelsParams,
  ContinueActivityParams,
  DelayedActionParams,
  DeleteActivityParams,
  GeolocationParams,
  ImportEventsParams,
  ImportGPXParams,
  LogActionParams,
  RefreshCachedActivityParams,
  RepeatedActionParams,
  ScrollActivityListParams,
  ScrollTimelineParams,
  SequenceParams,
  SleepParams,
  StartActivityParams,
  ZoomToActivityParams,
} from 'lib/actions'
import constants from 'lib/constants';
import database from 'lib/database';
import { Geo } from 'lib/geo';
import {
  cachedActivity,
  currentActivity,
  selectedActivity,
  timelineZoomValue,
} from 'lib/selectors';
import { postToServer } from 'lib/server';
import {
  AppState,
  CacheInfo,
  persistedFlags,
  persistedOptions,
} from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapUtils } from 'presenters/MapArea';
import {
  Activity,
  ActivityData,
  ActivityDataExtended,
  extendedActivities,
  loggableActivity,
} from 'shared/activities';
import {
  lastStartupTime,
  AppUserActionEvent,
  AppStateChange,
  AppStateChangeEvent,
  AppUserAction,
} from 'shared/appEvents';
import {
  AppQueryParams,
  AppQueryResponse
} from 'shared/appQuery';
import locations, {
  LocationEvent,
  LonLat,
  ModeChangeEvent,
  MotionEvent,
} from 'shared/locations';
import log from 'shared/log';
import {
  MarkEvent,
  MarkType
} from 'shared/marks';
import timeseries, {
  EventType,
  GenericEvent,
  TimeRange,
} from 'shared/timeseries';

const sagas = {

  // root saga wires things up
  root: function* () {
    // Avoid boilerplate by automatically yielding takeEvery for each AppAction
    for (let action in AppAction) {
      if (AppAction[action]) {
        yield call(log.debug, 'configuring saga for AppAction', action);
        if (action === AppAction.setAppOptionASAP) { // special case
          // With this action, *any* prior call to setAppOptionASAP not yet processed is ignored, so use with care!
          // This is really only appropriate for isolated rapid event sources like a slider that is being dragged.
          yield takeLatest(AppAction[action], sagas[AppAction[action]]);
        } else {
          // General case
          yield takeEvery(AppAction[action], sagas[AppAction[action]]);
        }
      } else {
        yield call(log.warn, 'unknown action in AppAction enum', action); // TODO why does this happen?
      }
    }
    // equivalent to
    // yield takeEvery(AppAction.firstAction, sagas.firstAction);
    // yield takeEvery(AppAction.secondAction, sagas.secondAction);
    // yield takeEvery(AppAction.thirdAction, sagas.thirdAction);
    // ...
  },

  // From here on, functions are alphabetized:

  // Note: To keep this simple it's currently required that added events be sorted by t and consistent in activityId.
  addEvents: function* (action: Action) {
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

    // Scan through the new events to compute. This is a simple loop.
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const id = event.activityId;
      if (event.t < previousEventTimestamp) {
        yield call(log.warn, 'addEvents: added events are out of order (not yet supported)');
      } else {
        previousEventTimestamp = event.t;
      }
      if (activityId && id && id !== activityId) {
        yield call(log.warn, 'addEvents: multiple activityIds detected (not yet supported)');
      } else {
        if (id) {
          activityId = id;
        }
      }
      if (event.type ==  EventType.LOC) {
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
        const update: ActivityData = { id: activity.id };
        update.count = (activity.count || 0) + events.length;
        const pathExtension = [] as LonLat[];
        // If the firstNewLoc comes before activity's tLastUpdate, we are not simply appending. !! converts to boolean.
        // The typical case of simply appending one or more events to an Activity is handled here with little work.
        // The case of inserting events in the middle of an existing Activity is handled by the big else block below.
        const appending: boolean = !!(firstNewLoc && firstNewLoc.t > activity.tLastUpdate);
        if (appending) {
          // odoStart
          if (firstNewOdo) {
            if (!activity.odoStart || firstNewOdo < activity.odoStart) {
              update.odoStart = firstNewOdo;
            }
          }
          // odo
          if (lastNewLoc) {
            update.tLastLoc = Math.max(activity.tLastLoc || 0, lastNewLoc.t);
            update.odo = lastNewLoc.odo;
          }
          // pathExtension
          for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (event.type == EventType.LOC) {
              const { accuracy, lon, lat } = event as LocationEvent;
              if (accuracy && accuracy <= constants.paths.metersAccuracyRequired) {
                pathExtension.push([lon, lat]); // add a single path segment
              }
            }
          }
          // maxGaps (maxGapTime, tMaxGapTime, maxGapDistance, tMaxGapDistance)
          if (activity.tLastLoc && firstNewLoc) {
            const gapTime = firstNewLoc.t - activity.tLastLoc;
            if (!activity.maxGapTime || gapTime > activity.maxGapTime) {
              update.maxGapTime = gapTime;
              update.tMaxGapTime = activity.tLastLoc;
            }
            if (firstNewLoc.odo && activity.odo) {
              const gapDistance = firstNewLoc.odo - activity.odo;
              if (!activity.maxGapDistance || gapDistance > activity.maxGapDistance) {
                update.maxGapDistance = gapDistance;
                update.tMaxGapDistance = activity.tLastLoc;
              }
            }
          }
        } else { // not simply appending events; recalc entire path et al (note new events were already added above)
          // Fetch all the events for this activity. This is an expensive operation we want to avoid whenever possible.
          const eventsForActivity = yield call(database.eventsForActivity, activityId);
          update.pathLats = [];
          update.pathLons = [];
          let prevLocEvent: LocationEvent | null = null;
          for (let e of eventsForActivity) { // Loop through all the events. events are already sorted by time.
            const event = e as any as GenericEvent;
            if (e.type === EventType.LOC) {
              const locEvent = event as LocationEvent;
              const { accuracy, lon, lat, t } = locEvent;
              if (accuracy && accuracy <= constants.paths.metersAccuracyRequired) {
                update.pathLats.push(lat);
                update.pathLons.push(lon);
              }
              update.tLastLoc = Math.max(activity.tLastLoc || 0, t);

              // maxGaps (maxGapTime, tMaxGapTime, maxGapDistance, tMaxGapDistance)
              if (prevLocEvent !== null) {
                const gapTime = locEvent.t - prevLocEvent.t;
                if (!activity.maxGapTime || gapTime > activity.maxGapTime) {
                  if (!update.maxGapTime || gapTime > update.maxGapTime) {
                    update.maxGapTime = gapTime;
                    update.tMaxGapTime = prevLocEvent.t;
                  }
                }
                if (locEvent.odo && prevLocEvent.odo) {
                  const gapDistance = locEvent.odo - prevLocEvent.odo;
                  if (!activity.maxGapDistance || gapDistance > activity.maxGapDistance) {
                    if (!update.maxGapDistance || gapDistance > update.maxGapDistance) {
                      update.maxGapDistance = gapDistance;
                      update.tMaxGapDistance = prevLocEvent.t;
                    }
                  }
                }
              }
              prevLocEvent = { ...locEvent };
            }
          }
        }
        update.tLastUpdate = utils.now();
        yield call(database.updateActivity, update, pathExtension);
      }
    }
  },

  // appQuery is used for debugging
  // TODO disable for production
  appQuery: function* (action: Action) {
    try {
      const params = action.params as AppQueryParams;
      yield call(log.debug, 'appQuery', params);
      const { query, uuid } = params;
      const queryType = query ? query.type : null;
      const state = store.getState();
      let response: any = `response to uuid ${uuid}`; // generic fallback response
      switch (queryType) {

        case 'activities': { // all
          let realmActivities = yield call(database.activities);
          let results = [] as any;
          let activities = Array.from(realmActivities) as any;
          for (let i = 0; i < activities.length; i++) {
            let modifiedActivity = loggableActivity(activities[i]);
            results.push(modifiedActivity);
          }
          response = { results };
          break;
        }
        case 'activity': { // default to current or selected if activityId not specified
          const state = yield select(state => state);
          const activity = query.activityId ? database.activityById(query.activityId)
                                            : currentActivity(state) || selectedActivity(state);
          let results = [] as any;
          if (activity) {
            let modifiedActivity = loggableActivity(activity);
            results.push({ activity: modifiedActivity });
            if (query.events) {
              const events = (yield call(database.events)).filtered(`activityId == "${query.activityId}"`);
              results.push({ events: query.count ? events.length : Array.from(events) })
            }
            response = { results };
          }
          break;
        }
        case 'cache': {
          const cache: CacheInfo = yield select(state => state.cache);
          response = {
            activityCount: cache.activities ? cache.activities.length : 0,
            refreshCount: cache.refreshCount,
          }
          break;
        }
        case 'counts': {
          response = {
            activities: (yield call(database.activities)).length,
            events: (yield call(database.events)).length,
          }
          break;
        }
        case 'emailLog': {
          Geo.emailLog();
          break;
        }
        case 'events': {
          const events = yield call(database.events);
          let timeRange = query.timeRange || [0, Infinity];
          if (query.sinceLastStartup) {
            timeRange = [lastStartupTime(events) || timeRange[0], Math.min(timeRange[1], Infinity)];
          } else if (query.since) {
            timeRange[0] = query.since;
          }
          let eventsFiltered = timeRange ? timeseries.filterByTime(events, timeRange) : events;
          // TODO these query options need to be updated for Realm.
          //
          // if (query.filterTypes) {
          //   if (query.exclude) {
          //     eventsFiltered = events.filter((e: GenericEvent) => !query.filterTypes!.includes(e.type));
          //   } else {
          //     eventsFiltered = events.filter((e: GenericEvent) => query.filterTypes!.includes(e.type));
          //   }
          // }
          // if (query.startIndex || query.limit) {
          //   const startIndex = query.startIndex || 0;
          //   events = events.slice(startIndex, startIndex + (query.limit || (events.length - startIndex)));
          // }
          response = query.count ? eventsFiltered.length : Array.from(eventsFiltered);
          break;
        }
        case 'eventCount': { // quick count of the total, no overhead
          response = (yield call(database.events)).length;
          break;
        }
        case 'lastStartupTime': {
          response = lastStartupTime(yield call(database.events));
          break;
        }
        case 'options': {
          response = { // include this slice of state
            flags: state.flags,
            options: state.options,
            userLocation: state.userLocation,
          }
          break;
        }
        case 'ping': {
          response = 'pong';
          break;
        }
        case 'selectedActivity': {
          const state = yield select(state => state);
          let activity = selectedActivity(state);
          let results = [] as any;
          if (activity) {
            let modified = loggableActivity(activity);
            results.push(modified);
            response = { results };
          }
          break;
        }

        case 'settings': {
          response = yield call(database.settings);
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

  appStateChange: function* (action: Action) {
    const params = action.params as AppStateChangeParams;
    const { newState } = params;
    yield call(log.info, 'appStateChange saga:', newState);
    const activeNow = (newState === AppStateChange.ACTIVE);
    yield put(newAction(activeNow ? AppAction.flagEnable : AppAction.flagDisable, 'appActive'));
    yield put(newAction(AppAction.setAppOption, { appState: newState }));
    const newAppStateChangeEvent = (newState: AppStateChange): AppStateChangeEvent => ({
      t: utils.now(),
      type: EventType.APP,
      newState,
    })
    yield put(newAction(AppAction.addEvents, { events: [newAppStateChangeEvent(newState)] }));
    if (activeNow) { // Don't do this in the background... might take too long
      yield call(Geo.processSavedLocations);
      const populated = yield select(state => state.cache.populated);
      yield call(log.debug, 'cache has been populated:', populated);
      if (!populated) { // Populate the cache for the first time
        yield put(newAction(AppAction.refreshCache));
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
      const haveUserLocation = yield select(state => !!state.userLocation);
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
            yield put(newAction(AppAction.stopFollowingUser)); // otherwise map may hop right back
          }
          if (zoom && newCenter) { // optional in CenterMapParams; applies for both absolute and relative
            const config = {
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
  // Centering the map should not affect zoom.
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

  // Caution: clearStorage is highly destructive, without warning or confirmation!
  clearStorage: function* () {
    try {
      yield call(database.reset);
      yield call(Geo.destroyLocations);
      yield call(Geo.destroyLog);
    } catch (err) {
      yield call(log.error, 'saga clearStorage', err);
    }
  },

  clockPress: function* (action: Action) {
    const params = action.params as ClockPressParams;
    const long = params && params.long;
    const nowClock = params && params.nowClock;
    yield call(log.trace, `clockPress, now: ${nowClock} long: ${long}`);
    // TODO experiment
    if (long) {
      const activity = yield select(state => selectedActivity(state));
      if (activity) {
        yield put(newAction(AppAction.deleteActivity, { id: activity.id }));
      }
    } else {
      yield put(newAction(AppAction.closePanels, { option: 'otherThanClockMenu' }));
      yield put(newAction(AppAction.flagToggle, 'clockMenuOpen'));
    }
  },

  // Panels here refer to popups / menus.
  closePanels: function* (action: Action) {
    const params = action.params as ClosePanelsParams;
    yield call(log.debug, 'saga closePanels', params);
    const option = (params && params.option) || '';
    const {
      clockMenuOpen,
      helpOpen,
      settingsOpen,
      topMenuOpen,
    } = yield select((state: AppState) => state.flags);

    if (clockMenuOpen && option !== 'otherThanClockMenu') {
      yield put(newAction(AppAction.flagDisable, 'clockMenuOpen'));
    }
    if (helpOpen && option !== 'otherThanHelp') {
      yield put(newAction(AppAction.flagDisable, 'helpOpen'));
    }
    if (settingsOpen && option !== 'otherThanSettings') {
      yield put(newAction(AppAction.flagDisable, 'settingsOpen'));
    }
    if (topMenuOpen && option !== 'otherThanTopMenu') {
      yield put(newAction(AppAction.flagDisable, 'topMenuOpen'));
    }
  },

  // Activities are 'continued' automatically when the app is terminated and then restarted during activity tracking,
  // whether the app was restarted manually, by the user, or automatically, in the background.
  continueActivity: function* (action: Action) {
    try {
      const params = action.params as ContinueActivityParams;
      const { activityId } = params;
      yield put(newAction(AppAction.startActivity, { continueActivityId: activityId }));
      yield put(newAction(AppAction.zoomToActivity, { id: activityId }));
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
      const { currentActivityId, selectedActivityId } = yield select(state => state.options);
      let deleteButton: AlertButton = {
        onPress: () => {
          log.info('Delete activity', id);
          if (id === currentActivityId) {
            log.warn('attempt to delete currentActivity (not permitted)');
            return;
          }
          store.dispatch(newAction(AppAction.refreshCachedActivity, { activityId: id, remove: true }));
          database.deleteActivity(id);
          if (id === selectedActivityId) {
            store.dispatch(newAction(AppAction.setAppOption, { selectedActivityId: null }));
          }
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

  //  After-effects (i.e. downstream side effects) of modifying app flags are handled here.
  flag_sideEffects: function* (flagName: string) {
    const flags = yield select((state: AppState) => state.flags);
    const enabledNow = flags[flagName];
    const appState = yield select((state: AppState) => state.options.appState);
    if (appState !== AppStateChange.STARTUP) {
      if (persistedFlags.includes(flagName)) {
        yield call(database.changeSettings, { [flagName]: enabledNow });
      }
    }
    if (flagName === 'backgroundGeolocation') {
      yield call(Geo.enableBackgroundGeolocation, enabledNow);
      if (flags.setPaceAfterStart && enabledNow) {
        // Set pace to moving to ensure we don't miss anything at the start, bypassing stationary monitoring.
        yield call(Geo.changePace, true, () => {
          log.debug('BackgroundGeolocation pace manually set to moving');
        })
      }
    }
    if (flagName === 'timelineNow') {
      if (enabledNow) {
        const pausedTime = yield select((state: AppState) => state.options.viewTime); // current pos of timeline
        yield put(newAction(AppAction.setAppOption, { pausedTime })); // remember prior position of timeline
        yield put(newAction(AppAction.timerTick, utils.now()));
      } else {
        // // disabling timelineNow TODO remove?
        // const pausedTime = yield select((state: AppState) => state.options.pausedTime); // apply prior pos of timeline
        // const { timelineScrolling } = flags;
        // if (timelineScrolling) {
        //   // TODO is this right? Can this ever happen?
        //   yield put(newAction(AppAction.setAppOption, { scrollTime: pausedTime }));
        // } else {
        //   yield put(newAction(AppAction.setAppOption, { scrollTime: pausedTime, viewTime: pausedTime }));
        // }
      }
    }
  },

  flagDisable: function* (action: Action) {
    const flagName: string = action.params;
    yield put(newAction(ReducerAction.FLAG_DISABLE, flagName));
    yield sagas.flag_sideEffects(flagName);
  },

  flagEnable: function* (action: Action) {
    const flagName: string = action.params;
    yield put(newAction(ReducerAction.FLAG_ENABLE, flagName));
    yield sagas.flag_sideEffects(flagName);
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
      const { locationEvents, recheckMapBounds } = action.params as GeolocationParams;
      const priorLocation = yield select(state => state.userLocation);
      yield put(newAction(ReducerAction.GEOLOCATION, locationEvents)); // this sets state.userLocation
      if (recheckMapBounds) {
        const appActive = yield select(state => state.flags.appActive);
        if (appActive) {
          // Potential cascading AppAction.centerMapOnUser:
          const map = MapUtils();
          if (map) {
            const { followingUser, keepMapCenteredWhenFollowing, loc } = yield select((state: AppState) => ({
              followingUser: state.flags.followingUser,
              keepMapCenteredWhenFollowing: state.flags.keepMapCenteredWhenFollowing,
              loc: locations.lonLat(state.userLocation!),
            }))
            const bounds = yield call(map.getVisibleBounds as any);
            if (followingUser) {
              const outOfBounds = keepMapCenteredWhenFollowing || (loc && bounds && !utils.locWellBounded(loc, bounds));
              if (!priorLocation || outOfBounds) {
                  yield put(newAction(AppAction.centerMapOnUser));
              }
            }
          }
        }
      }
    } catch (err) {
      yield call(log.error, 'geolocation', err);
    }
  },

  // TODO
  importEvents: function* (action: Action) {
    try {
      const params = action.params as ImportEventsParams;
      yield call(log.info, 'importEvents', params.include);
    } catch (err) {
      yield call(log.error, 'importEvents', err);
    }
  },

  // GPX: geolocation data that may have been eported from other apps, already converted from XML to JSON to POJO.
  // TODO process this GPX on the server and turn it into events there.
  importGPX: function* (action: Action) {
    // TODO2 - will return to this
    // try {
    //   const params = action.params as ImportGPXParams;
    //   yield call(log.info, 'importGPX', messageToLog(action), params.adjustStartTime, params.adjustEndTime);
    //   const gpx = (params.include as any).gpx; // GPX as JSON (already converted from XML)
    //   const gpxEvents = locations.eventsFromGPX(gpx);
    //   const source = gpxEvents[0].source || 'import';
    //   const activityId = uuid.default();
    //   const startEvent: MarkEvent = {
    //     ...timeseries.newSyncedEvent(gpxEvents[0].t),
    //     source,
    //     type: EventType.MARK,
    //     activityId,
    //     subtype: MarkType.START,
    //   }
    //   const endEvent: MarkEvent = {
    //     ...timeseries.newSyncedEvent(gpxEvents[gpxEvents.length - 1].t + 1),
    //     activityId,
    //     source,
    //     type: EventType.MARK,
    //     subtype: MarkType.END,
    //   }
    //   const events = [
    //     startEvent,
    //     ...gpxEvents,
    //     endEvent,
    //   ]
    //   const relativeTo = utils.now(); // TODO may want more flexibility later
    //   const adjustedEvents = timeseries.adjustTime(events, params.adjustStartTime, params.adjustEndTime, relativeTo);
    //   yield call(log.debug, 'adjustedEvents',
    //     relativeTo,
    //     adjustedEvents[0].t - relativeTo,
    //     adjustedEvents[adjustedEvents.length - 1].t - relativeTo);
    //   yield put(newAction(AppAction.addEvents, { events: adjustedEvents }));
    // } catch (err) {
    //   yield call(log.error, 'importGPX', err);
    // }
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
    yield put(newAction(ReducerAction.MAP_REGION, action.params as Polygon));
    yield put(newAction(AppAction.flagDisable, 'mapMoving'));
    yield put(newAction(AppAction.flagDisable, 'mapReorienting'));
  },

  // Triggered by Mapbox
  mapRegionChanging: function* (action: Action) {
    yield put(newAction(ReducerAction.MAP_REGION, action.params as Polygon));
    yield put(newAction(AppAction.flagEnable, 'mapMoving'));
  },

  mapTapped: function* (action: Action) {
    yield call(log.debug, 'saga mapTapped', action.params);
    yield put(newAction(AppAction.closePanels));
  },

  modeChange: function* (action: Action) {
    const modeChangeEvent = action.params as ModeChangeEvent;
    yield call(log.debug, 'saga modeChange', modeChangeEvent);
    const appActive = yield select((state: AppState) => state.flags.appActive);
    if (appActive) {
      yield put(newAction(AppAction.addEvents, { events: [modeChangeEvent]}));
    } // else TODO
  },

  motionChange: function* (action: Action) {
    const motionEvent = action.params as MotionEvent;
    yield call(log.debug, 'saga motionChange', motionEvent);
    const appActive = yield select((state: AppState) => state.flags.appActive);
    if (appActive) {
        yield put(newAction(AppAction.addEvents, { events: [motionEvent] }));
    } // else TODO
  },

  refreshCache: function* (action: Action) {
    try {
      yield call(log.debug, 'saga refreshCache');
      const timestamp = yield call(utils.now);
      const realmActivities = yield call(database.activities);
      const activitiesAsArray = Array.from(realmActivities) as ActivityData[]
      const activities = extendedActivities(activitiesAsArray);
      const refreshCount = (yield select(state => state.cache.refreshCount)) + 1;
      yield put(newAction(AppAction.cache, { activities, populated: true, refreshCount }));
      const now = yield call(utils.now);
      yield call(log.debug, 'new refreshCount', refreshCount, 'msec', now - timestamp, 'count', activities.length);
    } catch(err) {
      yield call(log.error, 'saga refreshCache', err);
    }
  },

  // updates, or removes stale entry from cache, as needed
  refreshCachedActivity: function* (action: Action) {
    try {
      const params = action.params as RefreshCachedActivityParams;
      const id = params.activityId;
      const { remove } = params;
      yield call(log.debug, 'saga refreshCachedActivity', id);
      const refreshCount = (yield select((state: AppState) => state.cache.refreshCount)) + 1;
      const activity = remove ? null : database.activityById(id);
      if (activity) {
        const activities = [...(yield select(state => state.cache.activities || []))];
        const extendedActivity = extendedActivities(Array.from([activity]) as ActivityData[])[0];
        const extendedActivityIndex = activities.findIndex(activity => activity.id === extendedActivity.id);
        if (extendedActivityIndex >= 0) {
          activities[extendedActivityIndex] = extendedActivity;
        } else {
          activities.push(extendedActivity);
        }
        yield put(newAction(AppAction.cache, { activities, refreshCount }));
      } else {
        const activities = (yield select(state => state.cache.activities)) as ActivityDataExtended[];
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
    yield call(log.trace, 'saga scroll scrollActivityList');
    const params = action.params as ScrollActivityListParams;
    const callbacks = yield select((state: AppState) => state.callbacks);
    if (callbacks.activityList !== undefined && callbacks.activityList.scrollToTime) {
      yield call(log.trace, 'scrollActivityList:', params.scrollTime);
      yield call(params.forceUpdate ? callbacks.activityList.autoScrollAfterForcedUpdate :
                                      callbacks.activityList.scrollToTime,
                 params.scrollTime);
    }
  },

  scrollTimeline: function* (action: Action) {
    yield call(log.trace, 'saga scroll TODO');
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

    // Actually set the options:
    const { params } = action;
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));

    // Then, handle side effects of setting app options:

    // An important side effect: Whenever viewTime is set, pausedTime and selectedActivityId may also be updated.
    // Note that setting scrollTime (which changes as the Timeline is scrolled) lacks these side effects.
    // Note that the AppAction.setAppOption within this block recurse back into this saga, but only one level deep.
    if (params.viewTime !== undefined) {
      const timelineNow = yield select(state => state.flags.timelineNow);
      const t = params.viewTime;
      if (!timelineNow) {
        // Setting viewTime when timeline is paused updates pausedTime.
        // pausedTime is used to 'jump back' to a previous timepoint. This could easily be turned into a history stack.
        yield put(newAction(AppAction.setAppOption, { pausedTime: t }));
      }
      const activity: Activity = yield call(database.activityForTimepoint, t); // may be null (which is ok)
      if (!activity || !activity.id) {
        yield put(newAction(AppAction.setAppOption, { selectedActivityId: null }));
      } else if (activity) {
        // This is where selectedActivity is set to the activity for the new viewTime.
        yield put(newAction(AppAction.setAppOption, { selectedActivityId: activity.id }));
      }
    }
    const timelineScrolling = yield select((state: AppState) => state.flags.timelineScrolling);
    if (timelineScrolling && params.scrollTime !== undefined) {
      yield put(newAction(AppAction.scrollActivityList, { scrollTime: params.scrollTime }));
      yield call(log.trace, 'setAppOption saga scrollTime:', params.scrollTime);
    }
    // Write through to settings in database, if needed
    const options = yield select((state: AppState) => state.options);
    const { appState } = options;
    if (appState !== AppStateChange.STARTUP) { // If starting up, avoid writing the same settings that were just read.
      const newSettings = {} as any;
      for (let propName of persistedOptions) {
        if (params[propName] !== undefined) {
          newSettings[propName] = params[propName];
        }
      }
      if (Object.entries(newSettings).length) {
        // yield call(log.trace, 'Writing settings to database', newSettings);
        yield call(database.changeSettings, newSettings);
      }
    }
  },

  // This is a wrapper that looks like a pass-through, but uses takeLatest in the root saga. Use with care!
  setAppOptionASAP: function* (action: Action) {
    yield put(newAction(AppAction.setAppOption, action.params));
  },

  setCallback: function* (action: Action) {
    try {
      yield put(newAction(ReducerAction.SET_CALLBACK, action.params));
    } catch (err) {
      yield call(log.error, 'saga setCallback', err);
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
      const continueActivityId = params.continueActivityId || undefined;
      const trackingActivity = yield select(state => state.flags.trackingActivity);
      if (!trackingActivity) {
        yield put(newAction(AppAction.flagEnable, 'backgroundGeolocation'));
        yield put(newAction(AppAction.flagEnable, 'trackingActivity'));
        yield put(newAction(AppAction.flagEnable, 'timelineNow'));
        yield put(newAction(AppAction.startFollowingUser));
        yield put(newAction(AppAction.centerMap, {
          center: [0, 0],
          option: 'relative',
          zoom: constants.map.default.zoomStartActivity,
        } as CenterMapParams));

        const now = utils.now();
        let activityId: string;
        if (continueActivityId) {
          // should already have the AppUserActionEvent and MarkEvent from before; just set currentActivityId.
          activityId = continueActivityId;
        } else {
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
        yield delay(0); // TODO seems required to allow ActivityList to get itself ready to scroll... race condition?
        yield put(newAction(AppAction.scrollActivityList, { forceUpdate: true, scrollTime: utils.now() }));
      }
    } catch (err) {
      yield call(log.error, 'saga startActivity', err);
    }
  },

  // Toggle
  startOrStopActivity: function* () {
    try {
      const trackingActivity = yield select(state => state.flags.trackingActivity);
      if (trackingActivity) {
        yield put(newAction(AppAction.stopActivity));
      } else {
        yield put(newAction(AppAction.startActivity));
      }
    } catch (err) {
      yield call(log.error, 'saga startOrStopActivity', err);
    }
  },

  startupActions: function* () {
    try {
      const { startupAction_clearStorage } = yield select(state => state.flags);
      if (startupAction_clearStorage) {
        yield put(newAction(AppAction.clearStorage));
      }
      const settings = yield call(database.settings) as any; // TODO typings
      yield call(log.info, 'Saved App settings', settings);

      for (let propName of persistedFlags) {
        if (settings[propName] !== undefined) {
          const actionType = (settings[propName] ? AppAction.flagEnable : AppAction.flagDisable);
          yield put(newAction(actionType, propName));
        }
      }
      const newSettings = {} as any;
      for (let propName of persistedOptions) {
        if (settings[propName] !== undefined) {
          newSettings[propName] = settings[propName];
        }
      }
      if (Object.entries(newSettings).length) {
        yield call(log.debug, 'Reading settings from database', newSettings);
        yield put(newAction(AppAction.setAppOption, newSettings));
      }
      const { currentActivityId } = settings;
      yield call(Geo.initializeGeolocation, store, !!currentActivityId); // use highPower if have currentActivityId
      if (currentActivityId) {
        yield call(log.info, 'Continuing previous activity...');
        yield put(newAction(AppAction.continueActivity, { activityId: currentActivityId }));
      } else {
        yield put(newAction(AppAction.startFollowingUser));
      }
    } catch (err) {
      yield call(log.error, 'startupActions exception', err);
    }
  },

  stopActivity: function* () {
    try {
      const trackingActivity = yield select(state => state.flags.trackingActivity);
      if (trackingActivity) {
        yield put(newAction(AppAction.flagDisable, 'backgroundGeolocation'));
        yield put(newAction(AppAction.flagDisable, 'trackingActivity'));
        const activityId = yield select(state => state.options.currentActivityId);
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
        if (activity) { // TODO error if not
          yield call(database.updateActivity, {
            id: activityId,
            tLastUpdate: now,
            tEnd: now,
          })
        }
        yield put(newAction(AppAction.flagDisable, 'timelineNow'));
        const halfTime = activity.tStart + (now - activity.tStart!) / 2;
        yield call(log.trace, 'stopActivity: halfTime', halfTime);
        yield put(newAction(AppAction.setAppOption,
          { currentActivityId: null, selectedActivityId: activityId, scrollTime: halfTime, viewTime: halfTime }));
        yield put(newAction(AppAction.zoomToActivity, { id: activityId }));
        yield put(newAction(AppAction.scrollActivityList, { scrollTime: halfTime }));
      }
    } catch (err) {
      yield call(log.error, 'saga stopActivity', err);
    }
  },

  // Follow the user, recentering map right away, kicking off background geolocation if needed.
  startFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga startFollowingUser');
      yield put(newAction(AppAction.flagEnable, 'followingUser'));
      yield call(Geo.startBackgroundGeolocation, 'navigating');
      const map = MapUtils();
      if (map) {
        yield put(newAction(AppAction.centerMapOnUser)); // cascading app action
      } else {
        yield call(log.warn, 'saga startFollowingUser: missing map');
      }
    } catch (err) {
      yield call(log.error, 'saga startFollowingUser', err);
    }
  },

  stopFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga stopFollowingUser');
      yield put(newAction(AppAction.flagDisable, 'followingUser'));
      // TODO leave background geolocation running in 'navigating' mode.
      // yield call(Geo.stopBackgroundGeolocation, 'navigating');
    } catch (err) {
      yield call(log.error, 'saga stopFollowingUser', err);
    }
  },

  // Respond to timeline pan/zoom. x is in the time domain.
  // viewTime changes here only after scrolling, whereas scrollTime changes during scrolling too.
  timelineZoomed: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const scrollTime = (x[0] + x[1]) / 2;
    yield put(newAction(AppAction.flagDisable, 'timelineScrolling'));
    yield put(newAction(AppAction.setAppOption, { scrollTime, viewTime: scrollTime }));
  },

  timelineZooming: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const scrollTime = (x[0] + x[1]) / 2;
    yield put(newAction(AppAction.setAppOptionASAP, { scrollTime })); // note: not changing viewTime! see timelineZoomed
    yield call(log.trace, 'timelineZooming', scrollTime);
  },

  // This goes off once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates
  // and it's a good frequency for updating the analog clock and the timeline.
  timerTick: function* (action: Action) {
    const appActive = yield select((state: AppState) => state.flags.appActive);
    if (appActive) { // avoid ticking the timer in the background
      const now = action.params as number;
      const { timelineNow, timelineScrolling } = yield select((state: AppState) => state.flags);
      const options = { nowTime: now } as any; // always update nowTime
      if (timelineNow) {
        options.scrollTime = now;
        if (!timelineScrolling) {
          options.viewTime = now;
        }
      }
      yield put(newAction(AppAction.setAppOption, options));
    }
  },

  // Stop following user after panning the map.
  userMovedMap: function* (action: Action) {
    try {
      yield call(log.debug, 'saga userMovedMap');
      yield put(newAction(AppAction.stopFollowingUser));
    } catch (err) {
      yield call(log.error, 'userMovedMap', err);
    }
  },

  zoomToActivity: function* (action: Action) {
    const { id } = action.params as ZoomToActivityParams;
    const state = yield select((state: AppState) => state);
    const activity = cachedActivity(state, id);
    if (activity) {
      yield call(log.debug, 'saga zoomToActivity', activity.id);
      // Fit map bounds to bounds of activity (with padding)
      const { duration, paddingHorizontal, paddingVertical } = constants.map.fitBounds;
      const map = MapUtils();
      if (map && map.fitBounds) {
        const { latMax, latMin, lonMax, lonMin } = activity;
        if (latMax !== undefined && latMin !== undefined && lonMax !== undefined && lonMin !== undefined) {
          map.fitBounds([lonMax, latMax], [lonMin, latMin], [paddingVertical, paddingHorizontal], duration);
        }
        if (id === state.options.currentActivityId) { // zooming to currentActivity automatically engages following
          yield put(newAction(AppAction.startFollowingUser));
        } else {
          yield put(newAction(AppAction.stopFollowingUser));
        }
      }
      // Zoom Timeline to show the entire activity, in context. Note we are not resetting its viewTime, just zooming.
      const tTotal = activity.tTotal || (utils.now() - activity.tStart!);
      if (activity.tTotal) {
        const newTimelineZoomValue = yield call(timelineZoomValue, tTotal);
        yield call(log.debug, 'newTimelineZoomValue', newTimelineZoomValue);
        yield put(newAction(AppAction.setAppOption, { timelineZoomValue: newTimelineZoomValue }));
      }
    }
  },
}

export default sagas;
