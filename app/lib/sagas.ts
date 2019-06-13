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
//   Use yield put instead of dispatch to issue a Redux action (be it an appAction or reducerAction.)
//   yield fork
//   yield cancel
//
// Note you must use yield select instead of accessing the store directly (yield the select effect)

import {
  call,
  put,
  select,
  takeEvery,
} from 'redux-saga/effects';

import { DomainPropType } from 'victory-native';

import { Geo } from 'lib/geo';
import log from 'lib/log';
import { AppState } from 'lib/state';
import { GenericEvent, LocationEvent, TimeRange } from 'shared/timeseries';
import utils from 'lib/utils';

import {
  Action,
  appAction,
  newAction,
  reducerAction,
} from 'lib/actions';

import { MapUtils } from 'components/MapArea';
import { Polygon } from '@turf/helpers';
import constants from 'lib/constants';

const sagas = {
  // Avoid boilerplate by automatically yielding takeEvery for each appAction
  root: function* () {
    for (let action in appAction) {
      // TODO why is action sometimes 0?
      if (appAction[action]) {
        log.debug('action', action, appAction[action]);
        yield takeEvery(appAction[action], sagas[appAction[action]]);
      } else {
        log.warn('unknown action in appAction enum', action); // TODO why does this happen?
      }
    }
    // equivalent to
    // yield takeEvery(appAction.firstAction, sagas.firstAction);
    // yield takeEvery(appAction.secondAction, sagas.secondAction);
    // yield takeEvery(appAction.thirdAction, sagas.thirdAction);
    // ...
  },

  // TODO for now these are more or less in order of when they were added. Maybe alphabetize.

  // This has the side effect of panning the map component imperatively.
  centerMapOnUser: function* () {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const loc = yield select((state: AppState) => state.loc);
        if (loc && loc.data && loc.data.lon && loc.data.lat) {
          const coordinates = [loc.data.lon, loc.data.lat];
          yield call(map.flyTo as any, coordinates);
        }
      }
    } catch (err) {
      log.error('saga centerMapOnUser', err);
    }
  },

  // follow the user, recentering map right away, kicking off background geolocation if needed
  startFollowingUser: function* () {
    try {
      log.debug('saga startFollowingUser');
      yield put(newAction(reducerAction.UI_FLAG_ENABLE, 'followingUser'));
      const map = MapUtils();
      if (map) {
        yield put(newAction(appAction.centerMapOnUser)); // cascading app action
      }
      yield call(Geo.startBackgroundGeolocation, 'following');
    } catch (err) {
      log.error('saga startFollowingUser', err);
    }
},

  stopFollowingUser: function* () {
    try {
      log.debug('saga stopFollowingUser');
      yield put(newAction(reducerAction.UI_FLAG_DISABLE, 'followingUser'));
      // yield call(Geo.stopBackgroundGeolocation, 'following');
    } catch (err) {
      log.error('saga stopFollowingUser', err);
    }
  },

  geolocation: function* (action: Action) {
    try {
      const locationEvent: LocationEvent = action.params as LocationEvent;
      yield put(newAction(reducerAction.GEOLOCATION, locationEvent));

      // Potential cascading appAction.centerMapOnUser:
      const map = MapUtils();
      if (map) {
        const { followingUser, keepMapCenteredWhenFollowing, loc } = yield select((state: any) => ({
          followingUser: state.ui.flags.followingUser,
          keepMapCenteredWhenFollowing: state.options.keepMapCenteredWhenFollowing,
          loc: state.loc,
        }))
        const bounds = yield call(map.getVisibleBounds as any);
        if (followingUser && loc && (keepMapCenteredWhenFollowing || !utils.locWellBounded(loc, bounds))) {
          yield put(newAction(appAction.centerMapOnUser));
        }
      }
    } catch (err) {
      log.error('geolocation', err);
    }
  },

  // This determines whether geolocation should be active when running the app in the background,
  // just in the foreground, or not at all (ghost mode)
  setGeolocationMode: function* (action: Action) {
    try {
      const id = action.params as number;
      yield put(newAction(reducerAction.SET_APP_OPTION, { name: 'geolocationModeId', value: id }));

      // This is the side-effect that belongs outside the reducer:
      Geo.setGeolocationMode(id);
    } catch (err) {
      log.error('setGeolocationMode', err);
    }
  },

  // Stop following user after panning the map.
  userMovedMap: function* (action: Action) {
    try {
      log.debug('saga userMovedMap');
      yield put(newAction(appAction.stopFollowingUser));
    } catch (err) {
      log.error('userMovedMap', err);
    }
  },

  // Set map bearing to 0 (true north) typically in response to user action (button).
  reorientMap: function* () {
    const map = MapUtils();
    if (map) {
      log.debug('saga reorientMap');
      const obj = { heading: 0, duration: constants.map.reorientationTime };
      yield put(newAction(reducerAction.UI_FLAG_ENABLE, 'mapMoving'));
      yield put(newAction(reducerAction.UI_FLAG_ENABLE, 'mapReorienting'));
      map.setCamera(obj);
    }
  },

  // Triggered by Mapbox
  mapRegionChanged: function* (action: Action) {
    // log.trace('saga mapRegionChanged', action.params);
    yield put(newAction(reducerAction.MAP_REGION, action.params as Polygon));
    yield put(newAction(reducerAction.UI_FLAG_DISABLE, 'mapMoving'));
    yield put(newAction(reducerAction.UI_FLAG_DISABLE, 'mapReorienting'));
  },

  // Triggered by Mapbox
  mapRegionChanging: function* (action: Action) {
    // log.trace('saga mapRegionChanging', action.params);
    yield put(newAction(reducerAction.UI_FLAG_ENABLE, 'mapMoving'));
  },

  mapTapped: function* (action: Action) {
    log.trace('saga mapTapped', action.params);

    const geolocationPanelOpen = yield select((state: AppState) => state.ui.panels.geolocation.open);
    const settingsOpen = yield select((state: AppState) => state.ui.panels.settings.open);

    if (geolocationPanelOpen) {
      yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
    } else if (settingsOpen) {
      yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
    } else {
      yield put(newAction(reducerAction.UI_FLAG_TOGGLE, 'mapFullScreen'));
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
      yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name, open: false }));
    } else {
      if (closeAll || name === 'geolocation') {
        yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
      }
      if (closeAll || name === 'settings') {
        yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
      }
      // open the new panel
      if (name) {
        yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name, open: true }));
      }
    }
  },

  backgroundTapped: function* (action: Action) {
    log.trace('saga backgroundTapped');
    yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'settings', open: false }));
    yield put(newAction(reducerAction.SET_PANEL_VISIBILITY, { name: 'geolocation', open: false }));
  },

  // Respond to timeline pan/zoom.
  timelineZoomed: function* (action: Action) {
    const newZoom = action.params as DomainPropType;
    const x = (newZoom as any).x as TimeRange; // TODO TypeScript definitions not allowing newZoom.x directly
    const refTime = (x[0] + x[1]) / 2;
    log.trace('saga timelineZoomed', refTime);
    yield put(newAction(reducerAction.SET_APP_OPTION, { name: 'refTime', value: refTime }));
  },

  // This goes off once a second like the tick of a mechanical watch.
  // One second is the approximate frequency of location updates
  // and it's a good frequency for updating the analog clock and the timeline.
  timerTick: function* (action: Action) {
    const now = action.params as number;
    // log.trace('timerTick', now);
    const timelineNow = yield select((state: AppState) => state.ui.flags.timelineNow);
    if (timelineNow) {
      yield put(newAction(reducerAction.SET_APP_OPTION, { name: 'refTime', value: now }));
    }
    // The approach for occasional scheduled actions such as server sync is to leverage this tick timer
    // rather than depend on a separate long-running timer. That could also work, but this is sufficient
    // when we don't need sub-second precision.
    const serverSyncInterval = yield select((state: AppState) => state.options.serverSyncInterval);
    const serverSyncTime = yield select((state: AppState) => state.options.serverSyncTime);
    if (now >= serverSyncTime + serverSyncInterval) {
      yield put(newAction(appAction.serverSync, now));
    }
  },

  setAppOption: function* (action: Action) {
    // for now, this is just a pass through to the reducer.
    log.debug('saga setAppOption', action);
    yield put(newAction(reducerAction.SET_APP_OPTION, action.params));
  },

  // Initiate or continue syncing data with the server.
  // This doesn't neecssarily sync everything that is pending at once, particularly with a big backlog.
  serverSync: function* (action: Action) {
    const now = action.params as number;
    yield put(newAction(reducerAction.SET_APP_OPTION, { name: 'serverSyncTime', value: now }));

    const events: GenericEvent[] = yield select((state: AppState) => state.events);
    const changedEvents: GenericEvent[] = [];
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
      yield put(newAction(reducerAction.SERVER_SYNC_COMPLETED, timestamps));
    }
  },
}

export default sagas;
