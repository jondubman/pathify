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
// Note you must use yield select instead of accessing the store directly (yield the select effect)
// Note also you should use yield call(log...) instead of log directly (yield call effect) so log happens at right time.

import { Polygon } from '@turf/helpers';
import AsyncStorage from '@react-native-community/async-storage';
import {
  call,
  delay,
  put,
  // putResolve,
  select,
  // spawn,
  takeEvery,
} from 'redux-saga/effects';

import { DomainPropType } from 'victory-native';

import {
  Action,
  AppAction,
  newAction,
  ReducerAction,

  AddEventsParams,
  AppQueryParams,
  CenterMapParams,
  DelayedActionParams,
  ImportEventsParams,
  ImportGPXParams,
  LogActionParams,
  PanTimelineParams,
  RepeatedActionParams,
  SaveEventsToStorageParams,
  SequenceParams,
  SleepParams,
  ZoomMapParams,

  AbsoluteRelativeOption,
} from 'lib/actions'

import constants from 'lib/constants';
import { Geo } from 'lib/geo';
import { postToServer } from 'lib/server';
import { AppState } from 'lib/state';
import store from 'lib/store';
import utils from 'lib/utils';
import { MapUtils } from 'presenters/MapArea';
import locations, { LocationEvent, ModeChangeEvent, MotionEvent } from 'shared/locations';
import log, { messageToLog } from 'shared/log';
import timeseries, { GenericEvent, GenericEvents, TimeRange, EventType } from 'shared/timeseries';
import { continuousTracks } from 'shared/tracks';

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
    const { events, saveEventsToStorage } = params;
    const sortedEvents = timeseries.sortEvents(events);
    yield put(newAction(ReducerAction.ADD_EVENTS, sortedEvents));
    if (saveEventsToStorage !== false) { // note undefined defaults to true
      const eventsToStore = timeseries.filterEvents(sortedEvents, (event: GenericEvent) => (!event.temp))
      yield put(newAction(AppAction.saveEventsToStorage, { events: eventsToStore }));
    }
  },

  appQuery: function* (action: Action) {
    try {
      const params = action.params as AppQueryParams;
      yield call(log.debug, 'appQuery', params);
      const { query, uuid } = params;
      const queryType = query ? query.type : null;
      const state = store.getState();
      let response: any = `response to uuid ${uuid}`; // default;
      switch (queryType) {
        case 'eventCount': {
          response = state.events.length;
          break;
        }
        case 'modeCount': {
          response = timeseries
            .filterEvents(state.events, (event: GenericEvent) => (event.type === EventType.MODE))
            .length;
          break;
        }
        case 'motionCount': {
          response = timeseries
            .filterEvents(state.events,(event: GenericEvent) => (event.type === EventType.MOTION))
            .length;
          break;
        }
        case 'options': {
          response = state.options;
          break;
        }
        case 'ping': {
          response = 'pong';
          break;
        }
        case 'storage': {
          const keys = yield call(AsyncStorage.getAllKeys);
          response = keys.length;
          break;
        }
        case 'ui': {
          response = state.ui;
          break;
        }
        case 'userLocation': {
          response = state.userLocation;
          break;
        }
      }
      yield call(postToServer as any, 'push/appQueryResponse', { type: 'appQueryResponse', params: { response, uuid }});
    } catch(err) {
      yield call(log.error, 'appQuery', err);
    }
  },

  backgroundTapped: function* (action: Action) {
    log.trace('saga backgroundTapped');
    yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
    yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
  },

  // Center map on absolute position or relative to current position (see CenterMapParams)
  centerMap: function* (action: Action) {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const params = action.params as CenterMapParams;
        const { center, option, zoom } = params;
        if (center) {
          let newCenter = center;
          if (option == AbsoluteRelativeOption.relative) {
            const currentCenter = yield call(map.getCenter as any);
            newCenter = [currentCenter[0] + center[0], currentCenter[1] + center[1]];
          }

          yield put(newAction(AppAction.stopFollowingUser)); // otherwise map may hop right back

          if (zoom) { // optional in CenterMapParams; applies for both absolute and relative
            const config = {
              centerCoordinate: center,
              zoom,
              duration: constants.map.centerMapDuration,
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
  centerMapOnUser: function* () {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const loc = yield select((state: AppState) => state.userLocation);
        if (loc && loc.data && loc.data.loc) {
          yield call(map.flyTo as any, loc.data.loc);
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

  delayedAction: function* (action: Action) {
    try {
      const params = action.params as DelayedActionParams;
      yield delay(params.after);
      yield put(params.run);
    } catch (err) {
      yield call(log.error, 'saga delayedAction', err);
    }
  },

  geolocation: function* (action: Action) {
    try {
      const locationEvent = action.params as LocationEvent;
      yield put(newAction(ReducerAction.GEOLOCATION, locationEvent));
      yield put(newAction(AppAction.saveEventsToStorage, { events: [ locationEvent ] }));

      // Potential cascading AppAction.centerMapOnUser:
      const map = MapUtils();
      if (map) {
        const { followingUser, keepMapCenteredWhenFollowing, loc } = yield select((state: AppState) => ({
          followingUser: state.ui.flags.followingUser,
          keepMapCenteredWhenFollowing: state.ui.flags.keepMapCenteredWhenFollowing,
          loc: state.userLocation!.data.loc,
        }))
        const bounds = yield call(map.getVisibleBounds as any);
        if (followingUser && loc && (keepMapCenteredWhenFollowing || !utils.locWellBounded(loc, bounds))) {
          yield put(newAction(AppAction.centerMapOnUser));
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
      const gpx = (params.include as any).gpx;
      const events = locations.eventsFromGPX(gpx);
      const relativeTo = utils.now(); // TODO may want more flexibility later
      const adjustedEvents = timeseries.adjustTime(events, params.adjustStartTime, params.adjustEndTime, relativeTo);
      yield call(log.debug, 'adjustedEvents',
        relativeTo, adjustedEvents[0].t - relativeTo, adjustedEvents[adjustedEvents.length - 1].t - relativeTo);
      yield put(newAction(AppAction.addEvents, { events: adjustedEvents }));
    } catch (err) {
      yield call(log.error, 'importGPX', err);
    }
  },

  loadEventsFromStorage: function* (action: Action) {
    try {
      const keys = yield call(AsyncStorage.getAllKeys);
      yield call(log.debug, 'loadEventsFromStorage: key count:', keys.length);
      if (keys.length) {
        // Note the context (AsyncStorage) needs to be passed in so 'this' is correct inside AsyncStorage's multiGet.
        const keyValuePairs = yield call([AsyncStorage, AsyncStorage.multiGet], keys);
        const events: GenericEvents = [];
        for (const keyValue of keyValuePairs) {
          const event = JSON.parse(keyValue[1]);
          events.push(event);
        }
        yield put(newAction(AppAction.addEvents, { events, saveEventsToStorage: false }));

        // TODO debug
        const sortedEvents = timeseries.sortEvents(events);
        const tracks = yield call(continuousTracks, sortedEvents, constants.maxTimeGapForContinuousTrack);
        yield call(log.debug, 'load event count', sortedEvents.length, 'loaded tracks', tracks.length, tracks);
      }
    } catch (err) {
      yield call(log.error, 'loadEventsFromStorage', err);
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
    yield put(newAction(ReducerAction.UI_FLAG_DISABLE, 'mapMoving'));
    yield put(newAction(ReducerAction.UI_FLAG_DISABLE, 'mapReorienting'));
  },

  // Triggered by Mapbox
  mapRegionChanging: function* (action: Action) {
    yield put(newAction(ReducerAction.UI_FLAG_ENABLE, 'mapMoving'));
  },

  mapTapped: function* (action: Action) {
    yield call(log.debug, 'saga mapTapped', action.params);

    const geolocationPanelOpen = yield select((state: AppState) => state.ui.panels.geolocation.open);
    const settingsOpen = yield select((state: AppState) => state.ui.panels.settings.open);

    if (geolocationPanelOpen) {
      yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
    } else if (settingsOpen) {
      yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
    } else {
      yield put(newAction(ReducerAction.UI_FLAG_TOGGLE, 'mapFullScreen'));
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
    if (option == AbsoluteRelativeOption.relative) {
      const refTime = yield select(state => state.options.refTime);
      newRefTime = refTime + t;
    }
    yield put(newAction(ReducerAction.UI_FLAG_DISABLE, 'timelineNow'));
    yield put(newAction(ReducerAction.SET_APP_OPTION, { refTime: newRefTime }));
  },

  // Set map bearing to 0 (true north) typically in response to user action (button).
  reorientMap: function* () {
    const map = MapUtils();
    if (map) {
      yield call(log.debug, 'saga reorientMap');
      const obj = { heading: 0, duration: constants.map.reorientationTime };
      yield put(newAction(ReducerAction.UI_FLAG_ENABLE, 'mapMoving'));
      yield put(newAction(ReducerAction.UI_FLAG_ENABLE, 'mapReorienting'));
      map.setCamera(obj);
    }
  },

  // See sequence saga.
  repeatedAction: function* () {
  },

  saveEventsToStorage: function* (action: Action) {
    const params = action.params as SaveEventsToStorageParams;
    const { events } = params;
    const keyValuePairs = events.map((event: GenericEvent) => ([ event.t.toString(), JSON.stringify(event) ]));
    yield call(log.debug, `saga saveEventsToStorage: saving ${keyValuePairs.length} event${keyValuePairs.length >1 ? 's' : ''}`);
    yield call(AsyncStorage.multiSet, keyValuePairs); // TODO handle errors
  },

  // The sequence action is an array of actions to be executed in sequence, such that
  //    -- the sleep action can be interspersed, and works as expected, delaying subsequent actions in the sequence;
  //    -- repeatedAction behaves as expected when containing a sub-sequence of
  sequence: function* (action: Action) {
    try {
      const runSequenceActions = async (sequenceActions: Action[]) => {
        for (let sequenceAction of sequenceActions) {
          log.debug('sequenceAction', sequenceAction);
          if (sequenceAction.type === AppAction.sleep) { // TODO sleep gets special treatment to ensure blocking execution
            const sleepTime = (sequenceAction.params as SleepParams).for;
            await new Promise(resolve => setTimeout(resolve, sleepTime));
          }
          if (sequenceAction.type == AppAction.repeatedAction) {
            const times = (sequenceAction.params as RepeatedActionParams).times;
            for (let i = 0; i < times; i++) {
              await runSequenceActions([sequenceAction.params.repeat]);
            }
          } else if (sequenceAction.type == AppAction.sequence) {
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

  setPanelVisibility: function* () {
  },

  // Initiate or continue syncing data with the server.
  // This doesn't neecssarily sync everything that is pending at once, particularly with a big backlog.
  // Note: see timerTick which is what typically triggers this saga.
  serverSync: function* (action: Action) {
    const now = action.params as number;
    yield put(newAction(ReducerAction.SET_APP_OPTION, { serverSyncTime: now }));

    const events: GenericEvents = yield select((state: AppState) => state.events);
    const changedEvents: GenericEvents = [];
    const timestamps: number[] = [];

    // For now, just loop through the whole array and accumulate the changed ones.
    // This simple approach will work fine until we have quite a large volume of data.
    // TODO use classical for loop for better perf?
    events.forEach(event => {
      if (event.changed) {
        changedEvents.push(event);
        timestamps.push(event.changed);
      }
    })
    if (changedEvents.length) {
      // TODO Actually send these changed events to the server!
      log.debug(`saga serverSync at ${now} syncing ${changedEvents.length} of ${events.length} total`);
      yield put(newAction(ReducerAction.SERVER_SYNC_COMPLETED, timestamps));
    }
  },

  setAppOption: function* (action: Action) {
    // for now, this is just a pass through to the reducer.
    log.debug('saga setAppOption', action);
    yield put(newAction(ReducerAction.SET_APP_OPTION, action.params));
  },

  // This determines whether geolocation should be active when running the app in the background,
  // just in the foreground, or not at all (ghost mode)
  setGeolocationMode: function* (action: Action) {
    try {
      const id = action.params as number;
      yield put(newAction(ReducerAction.SET_APP_OPTION, { geolocationModeId: id }));

      // This is the side-effect that belongs outside the reducer:
      Geo.setGeolocationMode(id);
    } catch (err) {
      yield call(log.error, 'setGeolocationMode', err);
    }
  },

  // follow the user, recentering map right away, kicking off background geolocation if needed
  startFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga startFollowingUser');
      yield put(newAction(ReducerAction.UI_FLAG_ENABLE, 'followingUser'));
      const map = MapUtils();
      if (map) {
        yield put(newAction(AppAction.centerMapOnUser)); // cascading app action
      }
      yield call(Geo.startBackgroundGeolocation, 'following');
    } catch (err) {
      yield call(log.error, 'saga startFollowingUser', err);
    }
  },

  stopFollowingUser: function* () {
    try {
      yield call(log.debug, 'saga stopFollowingUser');
      yield put(newAction(ReducerAction.UI_FLAG_DISABLE, 'followingUser'));
      // yield call(Geo.stopBackgroundGeolocation, 'following');
    } catch (err) {
      yield call(log.error, 'saga stopFollowingUser', err);
    }
  },

  // Respond to timeline pan/zoom.
  timelineZoomed: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly

    const refTime = (x[0] + x[1]) / 2;
    log.trace('saga timelineZoomed', refTime);
    yield put(newAction(ReducerAction.UI_FLAG_DISABLE, 'timelineNow'));
    yield put(newAction(ReducerAction.SET_APP_OPTION, { refTime }));
  },

  // This goes off once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates
  // and it's a good frequency for updating the analog clock and the timeline.
  timerTick: function* (action: Action) {
    const now = action.params as number;
    // log.trace('timerTick', now);
    const timelineNow = yield select((state: AppState) => state.ui.flags.timelineNow);
    if (timelineNow) {
      // This is where the mode for the Timeline really takes effect.
      yield put(newAction(ReducerAction.SET_APP_OPTION, { refTime: now }));
    }
    // The approach for occasional scheduled actions such as server sync is to leverage this tick timer
    // rather than depend on a separate long-running timer. That could also work, but this is sufficient
    // when we don't need sub-second precision.
    const serverSyncInterval = yield select((state: AppState) => state.options.serverSyncInterval);
    const serverSyncTime = yield select((state: AppState) => state.options.serverSyncTime);
    if (now >= serverSyncTime + serverSyncInterval) {
      yield put(newAction(AppAction.serverSync, now));
    }
  },

  // If named panel is open, it will be closed.
  // If named panel is closed, any opened panels will be closed, and the named panel will be opened.
  // If named panel is empty (or unknown), any open panels will be closed.
  togglePanelVisibility: function* (action: Action) {
    log.trace('saga togglePanelVisibility', action.params);
    const name = action.params as string;
    const panels = yield select((state: AppState) => state.ui.panels);
    const closeAll = !name || (name === '') || !panels[name];

    if (!closeAll && panels[name].open) {
      yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name, open: false }));
    } else {
      if (closeAll || name === 'geolocation') {
        yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
      }
      if (closeAll || name === 'settings') {
        yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
      }
      // open the new panel
      if (name) {
        yield put(newAction(ReducerAction.SET_PANEL_VISIBILITY, { name, open: true }));
      }
    }
  },

  uiFlagDisable: function* (action: Action) {
    yield put(newAction(ReducerAction.UI_FLAG_DISABLE, action.params));
  },

  uiFlagEnable: function* (action: Action) {
    yield put(newAction(ReducerAction.UI_FLAG_ENABLE, action.params));
  },

  uiFlagToggle: function* (action: Action) {
    yield put(newAction(ReducerAction.UI_FLAG_TOGGLE, action.params));
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

  zoomMap: function* (action: Action) {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const params = action.params as ZoomMapParams;
        const { option, zoom } = params;
        let newZoom = zoom;
        const currentCenter = yield call(map.getCenter as any); // will not change
        if (option == AbsoluteRelativeOption.relative) {
          const currentZoom = yield call(map.getZoom as any);
          newZoom = currentZoom + zoom;
        }
        const config = {
          centerCoordinate: currentCenter,
          zoom: newZoom,
          duration: 1000, // TODO
        }
        yield call(map.setCamera as any, config);
      }
    } catch (err) {
      yield call(log.error, 'saga centerMap', err);
    }
  },
}

export default sagas;
