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
// Inside one of these sgas, you should generally use yield call for any async function call.
// Use yield call(log...) instead of log directly (yield call effect) so the call happens at the right time.

import { Polygon } from '@turf/helpers';
import AsyncStorage from '@react-native-community/async-storage';
import RNRestart from 'react-native-restart';
import {
  call,
  delay,
  put,
  // putResolve,
  select,
  // spawn,
  takeEvery,
} from 'redux-saga/effects';

import * as uuid from 'uuid/v4';

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
  DelayedActionParams,
  GeolocationParams,
  ImportEventsParams,
  ImportGPXParams,
  LogActionParams,
  PanTimelineParams,
  RepeatedActionParams,
  SequenceParams,
  SleepParams,
  SliderMovedParams,
} from 'lib/actions'

import constants from 'lib/constants';
import { Geo } from 'lib/geo';
// import { timelineVisibleTime } from 'lib/selectors';
import { postToServer } from 'lib/server';
import { AppState } from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapUtils } from 'presenters/MapArea';
import {
  lastStartupTime,
  AppUserActionEvent,
  AppStateChange,
  AppStateChangeEvent,
  AppUserAction,
} from 'shared/appEvents';
import { AppQueryParams, AppQueryResponse } from 'shared/appQuery';
import locations, {
  ModeChangeEvent,
  MotionEvent,
  TickEvent,
} from 'shared/locations';
import log, { messageToLog } from 'shared/log';
import {
  Activity,
  containingActivity,
  insertMissingStopMarks, // TODO call insertMissingStopMarks when the app loads
  MarkEvent,
  MarkType
} from 'shared/marks';
import timeseries, {
  EventType,
  GenericEvent,
  TimeRange,
} from 'shared/timeseries';

const sagas = {

  root: function* () {
    // Avoid boilerplate by automatically yielding takeEvery for each AppAction
    for (let action in AppAction) {
      if (AppAction[action]) {
        yield call(log.debug, 'configuring saga for AppAction', action);
        yield takeEvery(AppAction[action], sagas[AppAction[action]]);
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

    const sortedEvents = timeseries.sortEvents(events);

    yield put(newAction(ReducerAction.ADD_EVENTS, sortedEvents));
  },

  appStateChange: function* (action: Action) {
    const params = action.params as AppStateChangeParams;
    const { newState } = params;
    const newAppStateChangeEvent = (newState: AppStateChange): AppStateChangeEvent => ({
      t: utils.now(),
      type: EventType.APP,
      newState,
    })
    yield put(newAction(AppAction.addEvents, { events: [newAppStateChangeEvent(newState)] }));
    yield put(newAction(newState === AppStateChange.ACTIVE || newState === AppStateChange.STARTUP ? AppAction.flagEnable
      : AppAction.flagDisable, 'appActive'));
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
        case 'events': {
          let timeRange = query.timeRange || [ 0, Infinity ];
          if (query.sinceLastStartup) {
            timeRange = [ lastStartupTime(state.events) || timeRange[0], Math.min(timeRange[1], Infinity) ];
          }
          let events = timeRange ? timeseries.filterByTime(state.events, timeRange) : [ ...state.events ];
          if (query.filterTypes) {
            if (query.exclude) {
              events = events.filter((e: GenericEvent) => !query.filterTypes!.includes(e.type));
            } else {
              events = events.filter((e: GenericEvent) => query.filterTypes!.includes(e.type));
            }
          }
          if (query.startIndex || query.limit) {
            const startIndex = query.startIndex || 0;
            events = events.slice(startIndex, startIndex + (query.limit || (events.length - startIndex)));
          }
          response = query.count ? events.length : events;
          break;
        }
        case 'eventCount': { // quick count of the total, no overhead
          response = state.events.length;
          break;
        }
        case 'lastStartupTime': {
          response = lastStartupTime(state.events);
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
        const loc = yield select((state: AppState) => state.userLocation);
        if (loc && loc.loc) {
          yield call(map.flyTo as any, loc.loc);
        }
      }
    } catch (err) {
      yield call(log.error, 'saga centerMapOnUser', err);
    }
  },

  clearStorage: function* () {
    try {
      const keys = yield call(AsyncStorage.getAllKeys);
      yield call(log.info, `clearStorage: clearing ${keys.length} keys from AsyncStorage`);
      yield call(AsyncStorage.clear);
    } catch (err) {
      yield call(log.error, 'saga clearStorage', err);
    }
  },

  clockPress: function* (action: Action) {
    const timelineShowing = yield select((state: AppState) => (!state.flags.mapFullScreen))
    if (timelineShowing) {
      yield put(newAction(AppAction.flagToggle, 'clockMenuOpen'));
    } else {
      yield put(newAction(AppAction.flagDisable, 'mapFullScreen'));
      yield put(newAction(AppAction.flagEnable, 'clockMenuOpen'));
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
      const options = yield select((state: AppState) => state.options);
      const enabledNow = flags[flagName];
      const now = utils.now();
      const startOrStopEvent: AppUserActionEvent = {
        ...timeseries.newSyncedEvent(now),
        type: EventType.USER_ACTION,
        userAction: enabledNow ? AppUserAction.START : AppUserAction.STOP,
      }
      const newActivityId = enabledNow ? uuid.default() : options.currentActivity.id;
      const startOrEndMarkEvent: MarkEvent = {
        ...timeseries.newSyncedEvent(now),
        type: EventType.MARK,
        id: newActivityId,
        subtype: enabledNow ? MarkType.START : MarkType.END,
      }
      yield put(newAction(AppAction.addEvents, { events: [startOrStopEvent, startOrEndMarkEvent ] }));
      yield call(Geo.enableBackgroundGeolocation, enabledNow);

      const newCurrentActivity: Activity | null = enabledNow ? {
        id: newActivityId,
        tr: [now, Infinity],
      } : null;
      yield put(newAction(AppAction.setAppOption, {
        currentActivity: newCurrentActivity,
        selectedActivity: null,
      }))

      if (flags.setPaceAfterStart && enabledNow) {
        // Set pace to moving to ensure we don't miss anything at the start, bypassing stationary monitoring.
        yield call(Geo.changePace, true, () => {
          log.debug('BackgroundGeolocation pace manually set to moving');
        })
      }
    }
    if (flagName === 'clockMenuOpen') {
      const flags = yield select((state: AppState) => state.flags);
      if (flags.clockMenuOpen) {
        yield put(newAction(AppAction.flagDisable, 'mapFullScreen')); // show timeline when clockMenu is open
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

  geolocation: function* (action: Action) {
    try {
      const { locationEvents, recheckMapBounds } = action.params as GeolocationParams;
      const priorLocation = yield select(state => state.userLocation);
      yield put(newAction(ReducerAction.GEOLOCATION, locationEvents));
      if (recheckMapBounds) {
        const appActive = yield select(state => state.flags.appActive);
        if (appActive) {
          // Potential cascading AppAction.centerMapOnUser:
          const map = MapUtils();
          if (map) {
            const { followingUser, keepMapCenteredWhenFollowing, loc } = yield select((state: AppState) => ({
              followingUser: state.flags.followingUser,
              keepMapCenteredWhenFollowing: state.flags.keepMapCenteredWhenFollowing,
              loc: state.userLocation!.loc,
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
    try {
      const params = action.params as ImportGPXParams;
      yield call(log.info, 'importGPX', messageToLog(action), params.adjustStartTime, params.adjustEndTime);
      const gpx = (params.include as any).gpx; // GPX as JSON (already converted from XML)
      const gpxEvents = locations.eventsFromGPX(gpx);
      const source = gpxEvents[0].source || 'import';
      const id = uuid.default();
      const startEvent: MarkEvent = {
        ...timeseries.newSyncedEvent(gpxEvents[0].t),
        source,
        type: EventType.MARK,
        id,
        subtype: MarkType.START,
      }
      const endEvent: MarkEvent = {
        ...timeseries.newSyncedEvent(gpxEvents[gpxEvents.length - 1].t + 1),
        source,
        type: EventType.MARK,
        id,
        subtype: MarkType.END,
      }
      const events = [
        startEvent,
        ...gpxEvents,
        endEvent,
      ]
      const relativeTo = utils.now(); // TODO may want more flexibility later
      const adjustedEvents = timeseries.adjustTime(events, params.adjustStartTime, params.adjustEndTime, relativeTo);
      yield call(log.debug, 'adjustedEvents',
        relativeTo,
        adjustedEvents[0].t - relativeTo,
        adjustedEvents[adjustedEvents.length - 1].t - relativeTo);
      yield put(newAction(AppAction.addEvents, { events: adjustedEvents }));
    } catch (err) {
      yield call(log.error, 'importGPX', err);
    }
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
    yield put(newAction(AppAction.flagEnable, 'mapMoving'));
  },

  mapTapped: function* (action: Action) {
    yield call(log.debug, 'saga mapTapped', action.params);
    const settingsOpen = yield select((state: AppState) => state.flags.settingsOpen);
    if (settingsOpen) {
      yield put(newAction(AppAction.flagDisable, 'settingsOpen'));
    } else {
      yield put(newAction(AppAction.flagToggle, 'mapFullScreen'));
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
    yield put(newAction(AppAction.addEvents, { events: [ modeChangeEvent ]}));
  },

  motionChange: function* (action: Action) {
    const motionEvent = action.params as MotionEvent;
    yield call(log.debug, 'saga motionChange', motionEvent);
    yield put(newAction(AppAction.addEvents, { events: [ motionEvent ] }));
  },

  panTimeline: function* (action: Action) {
    const params = action.params as PanTimelineParams;
    const { t, option } = params;
    let newRefTime = t;
    if (option === AbsoluteRelativeOption.relative) {
      const refTime = yield select(state => state.options.refTime);
      newRefTime = refTime + t;
    }
    yield put(newAction(AppAction.flagDisable, 'timelineNow'));
    yield put(newAction(AppAction.setAppOption, { refTime: newRefTime }));
  },

  tickEvent: function* (action: Action) {
    try {
      const tickEvent = action.params as TickEvent;
      yield call(log.trace, 'saga tickEvent', tickEvent);
      yield put(newAction(ReducerAction.TICK_EVENT, tickEvent));
    } catch (err) {
      yield call(log.error, 'tickEvent', err);
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

  // Note sleep only works as expected if enclosed in a sequence action; sequence is where sleep is really implemented.
  // Behavior is odd when nesting sequences involving sleep and repeated actions if not enclosed in a sequence.
  // Mostly, more things will happen in parallel than you might anticipate, due to the somewhat subtle semantics of
  // these redux-saga generators, which cannot use async/await.
  sleep: function* () {
  },

  sliderMoved: function* (action: Action) {
    const params = action.params as SliderMovedParams;
    const { value } = params; // between 0 and 1
    // yield call(log.trace, 'saga sliderMoved', value, timelineVisibleTime(value));
    yield put(newAction(AppAction.setAppOption, { timelineZoomValue: value }));
  },

  setPanelVisibility: function* () {
  },

  setAppOption: function* (action: Action) {
    // if (!action.params.refTime) {
    //   yield call(log.trace, 'saga setAppOption', action);
    // }
    // First set the option itself:
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));

    // Then, handle side effects:

    // Whenever refTime is set, update selectedActivity automatically based on marks.containingActivity,
    // which looks for bookending MarkType.START and MarkType.END events.
    if (action.params.refTime) {
      const timelineNow = yield select(state => state.flags.timelineNow);
      const events = yield select(state => state.events);
      const currentActivity = yield select(state => state.options.currentActivity);
      if (timelineNow) {
        yield put(newAction(AppAction.setAppOption, { selectedActivity: null })); // recursive
      } else {
        const activity = yield call(containingActivity, events, action.params.refTime); // may be null (which is ok)
        if (activity && currentActivity && currentActivity.tr[0] === activity!.tr[0]) {
          // Avoid a selectedActivity that would be redundant to currentActivity.
          const selectedActivity = yield select(state => state.options.selectedActivity);
          if (selectedActivity) {
            yield put(newAction(AppAction.setAppOption, { selectedActivity: null })); // recursive
          }
        } else {
          yield put(newAction(AppAction.setAppOption, { selectedActivity: activity })); // recursive
        }
      }
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
      yield call(Geo.startBackgroundGeolocation, 'following');
    } catch (err) {
      yield call(log.error, 'saga startFollowingUser', err);
    }
  },

  startStopActivity: function* () {
    try {
      const alreadyEnabled = yield select(state => state.flags.backgroundGeolocation);
      yield put(newAction(AppAction.flagToggle, 'backgroundGeolocation'));
      if (!alreadyEnabled) {
        // yield put(newAction(AppAction.startFollowingUser));
        yield put(newAction(AppAction.flagEnable, 'followingUser')); // handle map recentering ourselves
        yield put(newAction(AppAction.flagEnable, 'timelineNow'));
        yield put(newAction(AppAction.centerMap, {
          center: [0, 0],
          option: 'relative',
          zoom: constants.map.default.zoomStartActivity,
        } as CenterMapParams));
      }
    } catch (err) {
      yield call(log.error, 'saga startStopActivity', err);
    }
  },

  stopFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga stopFollowingUser');
      yield put(newAction(AppAction.flagDisable, 'followingUser'));
      yield call(Geo.stopBackgroundGeolocation, 'following');
    } catch (err) {
      yield call(log.error, 'saga stopFollowingUser', err);
    }
  },

  // Respond to timeline pan/zoom.
  timelineZoomed: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly

    const refTime = (x[0] + x[1]) / 2;
    yield call(log.trace, 'saga timelineZoomed', refTime);

    // TODO do not disable timelineNow unless refTime is changing
    yield put(newAction(AppAction.flagDisable, 'timelineNow'));
    yield put(newAction(AppAction.setAppOption, { refTime }));
  },

  // This goes off once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates
  // and it's a good frequency for updating the analog clock and the timeline.
  timerTick: function* (action: Action) {
    const appActive = yield select((state: AppState) => state.flags.appActive);
    if (appActive) {
      const now = action.params as number;
      // yield call(log.trace, 'timerTick', now);
      const timelineNow = yield select((state: AppState) => state.flags.timelineNow);
      if (timelineNow) {
        yield put(newAction(AppAction.setAppOption, { refTime: now }));
      }
      const tickEvents = yield select((state: AppState) => state.flags.tickEvents);
      if (tickEvents) {
        const tickEvent = { ...timeseries.newEvent(now), type: EventType.TICK };
        yield put(newAction(AppAction.tickEvent, tickEvent));
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
