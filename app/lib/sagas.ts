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

import { MenuItem } from 'containers/PopupMenusContainer';
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
  ContinueActivityParams,
  DelayedActionParams,
  GeolocationParams,
  ImportEventsParams,
  ImportGPXParams,
  LogActionParams,
  RepeatedActionParams,
  SequenceParams,
  SleepParams,
  SliderMovedParams,
  StartActivityParams,
} from 'lib/actions'
import constants from 'lib/constants';
import { Geo } from 'lib/geo';
import { postToServer } from 'lib/server';
import { AppState } from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapUtils } from 'presenters/MapArea';
import {
  Activity,
  ActivityUpdate,
} from 'shared/activities';
import {
  lastStartupTime,
  AppUserActionEvent,
  AppStateChange,
  AppStateChangeEvent,
  AppUserAction,
} from 'shared/appEvents';
import { AppQueryParams, AppQueryResponse } from 'shared/appQuery';
import database from 'shared/database';
import locations, {
  LocationEvent,
  LonLat,
  ModeChangeEvent,
  MotionEvent,
} from 'shared/locations';
import log, { messageToLog } from 'shared/log';
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
        if (action === AppAction.sliderMoved) {
          // Special case: For slider, always use latest position.
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

  addEvents: function* (action: Action) {
    const params = action.params as AddEventsParams;
    const { events } = params;
    if (events && events.length) {
      yield call(database.createEvents, events);
    }
    // Now update any Activity/Activities related to the added events. TODO shold this be factored out?
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const id = event.activityId;
      if (id) {
        const pathExtension = [] as LonLat[];
        const activity = yield call(database.activityById, id); // probably the same for each event, but doesn't matter
        if (activity) {
          const update: ActivityUpdate = { id: activity.id };
          update.count = activity.count ? activity.count + 1 : 1;
          if (event.type === EventType.LOC) {
            let outOfOrder = false;
            if (activity.tLastLoc && event.t < activity.tLastLoc) {
              yield call(log.trace, activity.tLastLoc, event.t, 'addEvents saga: adding LOC events out of order');
              outOfOrder = true;
            }
            // Appending events to an activity
            update.tLastLoc = Math.max(activity.tLastLoc || 0, event.t);
            // odo
            const odo = (event as LocationEvent).odo;
            if (odo) {
              update.odo = odo;
              if (!activity.odoStart || odo < activity.odoStart) {
                update.odoStart = odo; // set odoStart on the activity if not set already
              }
            }
            if (outOfOrder) {
              const eventsForActivity = yield call(database.eventsForActivity, id); // should include the added events
              update.pathLats = [];
              update.pathLons = [];
              for (let e of eventsForActivity) { // default sorted by time
                const event = e as any as GenericEvent;
                if (e.type === EventType.LOC) {
                  const locEvent = event as LocationEvent;
                  update.pathLats.push(locEvent.lat);
                  update.pathLons.push(locEvent.lon);
                  update.tLastLoc = Math.max(activity.tLastLoc || 0, locEvent.t);
                }
              }
            } else {
              const { lon, lat } = event as LocationEvent;
              pathExtension.push([ lon, lat ]);
            }
          }
          update.tLastUpdate = utils.now();
          yield call(database.updateActivity, update, pathExtension);
        }
      }
    }
  },

  appStateChange: function* (action: Action) {
    const params = action.params as AppStateChangeParams;
    const { newState } = params;
    yield call(log.info, 'appStateChange saga:', newState);
    const newAppStateChangeEvent = (newState: AppStateChange): AppStateChangeEvent => ({
      t: utils.now(),
      type: EventType.APP,
      newState,
    })
    yield put(newAction(AppAction.addEvents, { events: [newAppStateChangeEvent(newState)] }));
    const activeNow = (newState === AppStateChange.ACTIVE);
    yield put(newAction(activeNow ? AppAction.flagEnable : AppAction.flagDisable, 'appActive'));
    if (activeNow) { // Don't do this in the background... might take too long
      yield call(Geo.processSavedLocations);
    }
  },

  appQuery: function* (action: Action) {
    try {
      const params = action.params as AppQueryParams;
      yield call(log.debug, 'appQuery', params);
      const { query, uuid } = params;
      const queryType = query ? query.type : null;
      const state = store.getState();
      let response: any = `response to uuid ${uuid}`; // generic fallback response
      switch (queryType) {

        case 'activities': {
          let fullActivities = yield call(database.activities);
          let results = [] as any;
          let activities = Array.from(fullActivities) as any;
          for (let i = 0; i < activities.length; i++) {
            let modified = { ...activities[i] };
            modified.pathLats = modified.pathLats.length; // Return just the array length rather than all the
            modified.pathLons = modified.pathLons.length; // individual points.
            results.push(modified);
          }
          response = { results };
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
          let events = yield call(database.events);
          let timeRange = query.timeRange || [0, Infinity];
          if (query.sinceLastStartup) {
            timeRange = [lastStartupTime(events) || timeRange[0], Math.min(timeRange[1], Infinity)];
          } else if (query.since) {
            timeRange[0] = query.since;
          }
          let eventsFiltered = timeRange ? timeseries.filterByTime(events, timeRange) : events;
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
          response = {
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

  backgroundTapped: function* (action: Action) {
    yield call(log.trace, 'saga backgroundTapped');
    yield put(newAction(AppAction.flagDisable, 'settingsVisible'));
  },

  // Center map on absolute position or relative to current position (see CenterMapParams).
  // Note this has the side effect of disabling following on the map if the center is moved.
  centerMap: function* (action: Action) {
    try {
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
        }
      }
    } catch (err) {
      yield call(log.error, 'saga centerMapOnUser', err);
    }
  },

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
    const { clockMenuOpen, mapFullScreen } = yield select((state: AppState) => state.flags);
    const params = action.params as ClockPressParams;
    const long = params && params.long;
    if (mapFullScreen) { // enabled
      if (long) {
        yield put(newAction(AppAction.flagEnable, 'clockMenuOpen'));
        yield put(newAction(AppAction.flagDisable, 'mapFullScreen'));
      } else {
        yield put(newAction(AppAction.flagDisable, 'clockMenuOpen'));
        yield put(newAction(AppAction.flagDisable, 'mapFullScreen'));
      }
    } else { // disabled (Timeline shown)
      if (long) {
        if (clockMenuOpen) {
          yield put(newAction(AppAction.flagDisable, 'clockMenuOpen'));
        } else {
          yield put(newAction(AppAction.flagEnable, 'clockMenuOpen'));
        }
      } else {
        if (clockMenuOpen) {
          yield put(newAction(AppAction.flagDisable, 'clockMenuOpen'));
        } else {
          yield put(newAction(AppAction.flagEnable, 'mapFullScreen'));
        }
      }
    }
  },

  continueActivity: function* (action: Action) {
    try {
      const params = action.params as ContinueActivityParams;
      const { activityId } = params;
      yield put(newAction(AppAction.startActivity, { continueActivityId: activityId }));
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

  //  After-effects (i.e. downstream side effects) of modifying app flags are handled here.
  flag_sideEffects: function* (flagName: string) {

    if (flagName === 'backgroundGeolocation') {
      const flags = yield select((state: AppState) => state.flags);
      const enabledNow = flags[flagName];
      yield call(Geo.enableBackgroundGeolocation, enabledNow);
      if (flags.setPaceAfterStart && enabledNow) {
        // Set pace to moving to ensure we don't miss anything at the start, bypassing stationary monitoring.
        yield call(Geo.changePace, true, () => {
          log.debug('BackgroundGeolocation pace manually set to moving');
        })
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
  // TODO If these events are old, do we still want to do that?
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
    const params = action.params as LogActionParams;
    const { level, message } = params;
    yield call(log[level || 'debug'], message);
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
    const settingsOpen = yield select((state: AppState) => state.flags.settingsOpen);
    if (settingsOpen) {
      yield put(newAction(AppAction.flagDisable, 'settingsOpen'));
    }
  },

  menuItemSelected: function* (action: Action) {
    const menuItem: string = action.params;
    if (menuItem === MenuItem.NOW) {
      yield put(newAction(AppAction.flagToggle, 'timelineNow'));
    }
  },

  modeChange: function* (action: Action) {
    const modeChangeEvent = action.params as ModeChangeEvent;
    yield call(log.debug, 'saga modeChange', modeChangeEvent);
    // TODO2
    // yield put(newAction(AppAction.addEvents, { events: [modeChangeEvent]}));
  },

  motionChange: function* (action: Action) {
    const motionEvent = action.params as MotionEvent;
    yield call(log.debug, 'saga motionChange', motionEvent);
    // TODO2
    // yield put(newAction(AppAction.addEvents, { events: [motionEvent] }));
  },

  panTimeline: function* (action: Action) {
    // TODO this was for programmatic panning via script

    // const params = action.params as PanTimelineParams;
    // const { t, option } = params;
    // let newRefTime = t;
    // if (option === AbsoluteRelativeOption.relative) {
    //   const refTime = yield select(state => state.options.refTime);
    //   newRefTime = refTime + t;
    // }
    // yield put(newAction(AppAction.flagDisable, 'timelineNow'));
    // yield put(newAction(AppAction.setAppOption, { refTime: newRefTime, timelineRefTime: newRefTime }));
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

  // See sequence saga.
  repeatedAction: function* () {
  },

  // TODO not for production use
  restartApp: function* () {
    yield call(log.warn, 'saga restartApp');
    yield call(log.info, RNRestart);
    yield call(RNRestart.Restart);
  },

  // The sequence action is an array of actions to be executed in sequence, such that
  //    -- the sleep action can be interspersed, and works as expected, delaying subsequent actions in the sequence;
  //    -- repeatedAction behaves as expected when containing a sub-sequence
  sequence: function* (action: Action) {
    try {
      const runSequenceActions = async (sequenceActions: Action[]) => {
        for (let sequenceAction of sequenceActions) {
          log.debug('sequenceAction', sequenceAction);
          if (sequenceAction.type === AppAction.sleep) { // TODO sleep gets special treatment to ensure blocking execution
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
    // First set the option itself:
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));

    // Then, handle side effects:

    if (action.params.currentActivityId) {
      const { currentActivityId } = action.params;
      yield call(log.debug, 'Setting currentActivityId', currentActivityId);
      database.changeSettings({ currentActivityId });
    }
    if (action.params.currentActivityId === null) { // Explicit check for null
      database.changeSettings({ currentActivityId: null });
    }
    // Whenever refTime is set, update selectedActivity automatically based on marks.containingActivity,
    // which looks for bookending MarkType.START and MarkType.END events.
    if (action.params.refTime) {
      const timelineNow = yield select(state => state.flags.timelineNow);
      const currentActivityId = yield select(state => state.options.currentActivityId);
      if (timelineNow) {
        yield put(newAction(AppAction.setAppOption, { selectedActivityId: null })); // recursive
      } else {
        const t = action.params.refTime;
        const activity: Activity = yield call(database.activityForTimepoint, t); // may be null (which is ok)
        if (!activity || !activity.id || activity.id === currentActivityId) {
          // Clear selectedActivity if it would be redundant to currentActivity.
          yield put(newAction(AppAction.setAppOption, { selectedActivityId: null })); // recursive
        } else {
          yield put(newAction(AppAction.setAppOption, { selectedActivityId: activity.id })); // recursive
          // Note the currentActivity is never selected; If there's a currentActivity and a selectedActivity,
          // it's because something other than the currentActivity is selected. That way, a selectedActivity is always
          // a completed activity.
        }
      }
    }
  },

  // Note sleep only works as expected if enclosed in a sequence action; sequence is where sleep is really implemented.
  // Behavior is odd when nesting sequences involving sleep and repeated actions if not enclosed in a sequence.
  // Mostly, more things will happen in parallel than you might anticipate, due to the somewhat subtle semantics of
  // these redux-saga generators, which cannot use async/await.
  sleep: function* () {
  },

  // TODO right now this is hard-coded to the timeline zoom slider but should be generalized
  sliderMoved: function* (action: Action) {
    const params = action.params as SliderMovedParams;
    const { value } = params; // between 0 and 1
    yield put(newAction(AppAction.setAppOption, { timelineZoomValue: value }));
  },

  // Start (or continue!) an Activity:
  startActivity: function* (action: Action) {
    try {
      const params = action.params as StartActivityParams || {};
      const continueActivityId = params.continueActivityId || undefined;
      const trackingActivity = yield select(state => state.flags.trackingActivity);
      if (!trackingActivity) {
        yield put(newAction(AppAction.flagEnable, 'backgroundGeolocation'));
        yield put(newAction(AppAction.flagEnable, 'followingUser'));
        yield put(newAction(AppAction.flagEnable, 'timelineNow'));
        yield put(newAction(AppAction.flagEnable, 'trackingActivity'));
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
        yield put(newAction(AppAction.setAppOption, { currentActivityId: activityId }));
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
    const { startupAction_clearStorage } = yield select(state => state.flags);
    if (startupAction_clearStorage) {
      yield put(newAction(AppAction.clearStorage));
    }
    const settings = yield call(database.settings) as any; // TODO typings
    yield call(log.info, 'Persisted App settings', settings);

    const { currentActivityId } = settings;
    yield call(Geo.initializeGeolocation, store, !!currentActivityId);
    if (currentActivityId) {
      yield call(log.info, 'Continuing previous activity...');
      yield put(newAction(AppAction.continueActivity, { activityId: currentActivityId }));
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
        yield call(log.debug, 'stopActivity', activity);
        if (activity) { // TODO error if not
          yield call(database.updateActivity, {
            id: activityId,
            tLastUpdate: now,
            tEnd: now,
          })
        }
        yield put(newAction(AppAction.setAppOption, { currentActivityId: null }));
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
      const map = MapUtils();
      if (map) {
        yield put(newAction(AppAction.centerMapOnUser)); // cascading app action
      }
      yield call(Geo.startBackgroundGeolocation, 'navigating');
    } catch (err) {
      yield call(log.error, 'saga startFollowingUser', err);
    }
  },

  stopFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga stopFollowingUser');
      yield put(newAction(AppAction.flagDisable, 'followingUser'));
      // TODO3 leave background geolocation running in 'navigating' mode
      // yield call(Geo.stopBackgroundGeolocation, 'navigating');
    } catch (err) {
      yield call(log.error, 'saga stopFollowingUser', err);
    }
  },

  // Respond to timeline pan/zoom. x is in the time domain.
  // timelineRefTime changes here only after scrolling, whereas refTime changes during scrolling too.
  timelineZoomed: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const refTime = (x[0] + x[1]) / 2;
    yield put(newAction(AppAction.flagDisable, 'timelineScrolling'));
    yield put(newAction(AppAction.setAppOption, { refTime, timelineRefTime: refTime }));
  },

  timelineZooming: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const refTime = (x[0] + x[1]) / 2;
    yield put(newAction(AppAction.setAppOption, { refTime })); // note: not changing timelineRefTime! see timelineZoomed
    yield call(log.trace, 'timelineZooming', refTime);
  },

  // This goes off once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates
  // and it's a good frequency for updating the analog clock and the timeline.
  timerTick: function* (action: Action) {
    const appActive = yield select((state: AppState) => state.flags.appActive);
    const timelineScrolling = yield select((state: AppState) => state.flags.timelineScrolling);
    if (appActive && !timelineScrolling) { // TODO2 let's not tick the timer while we are trying to scroll
      const now = action.params as number;
      const { timelineNow, timelineScrolling } = yield select((state: AppState) => state.flags);
      if (timelineNow) {
        const options = { refTime: now } as any;
        if (!timelineScrolling) { // otherwise leave this alone until scrolling is complete TODO2
          options.timelineRefTime = now;
        }
        yield put(newAction(AppAction.setAppOption, options));
      }
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
}

export default sagas;
