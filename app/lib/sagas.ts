// For use with redux-saga. Coordination around app actions defined in actionTypes module.
// This is where we trigger possibly-asynchronous side effects for app actions.
// These may include other (cascading) app actions and/or reducer actions.
//
// Note reducers, unlike sagas, must always be synchronous.
//
// appActions are actually run through the reducer before any sagas are run, but the reducer ignores them.
//
// The fact that redux-sagas makes extensive use of JS generators is not the only thing to keep in mind.

// Blocking:
// Use yield call to call an async function instead of calling it directly (yield the call effect)
// yield take
// yield join

// Non-blocking:
// Use yield put instead of dispatch to issue a Redux action (be it an appAction or reducerAction.)
// yield fork
// yield cancel

// Use yield select instead of accessing the store directly (yield the select effect)

import {
  call,
  put,
  select,
  takeEvery,
} from 'redux-saga/effects';

import { Geo, LocationEvent } from 'lib/geo';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import utils from 'lib/utils';

import {
  Action,
  appAction,
  newAction,
  reducerAction,
} from 'lib/actions';

import { MapUtils } from 'components/MapArea';
import { Feature } from '@turf/helpers';
import constants from './constants';

const sagas = {
  root: function* () {
    yield takeEvery(appAction.CENTER_MAP_ON_USER, sagas.centerMapOnUser);
    yield takeEvery(appAction.GEOLOCATION, sagas.geolocation);
    yield takeEvery(appAction.SET_GEOLOCATION_MODE, sagas.setGeolocationMode);
    yield takeEvery(appAction.USER_MOVED_MAP, sagas.userMovedMap);
    yield takeEvery(appAction.REORIENT_MAP, sagas.reorientMap);
    yield takeEvery(appAction.MAP_REGION_CHANGED, sagas.mapRegionChanged);
    yield takeEvery(appAction.MAP_REGION_CHANGING, sagas.mapRegionChanging);
    yield takeEvery(appAction.MAP_TAPPED, sagas.mapTapped);

    yield takeEvery(appAction.START_FOLLOWING_USER, sagas.startFollowingUser);
    yield takeEvery(appAction.STOP_FOLLOWING_USER, sagas.stopFollowingUser);
  },

  // This has the side effect of panning the map component imperatively.
  centerMapOnUser: function* () {
    try {
      const map = MapUtils();
      if (map && map.flyTo) {
        const loc = yield select((state: AppState) => state.loc);
        if (loc && loc.lon && loc.lat) {
          const coordinates = [loc.lon, loc.lat];
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
        yield put(newAction(appAction.CENTER_MAP_ON_USER)); // cascading app action
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

      // Potential cascading appAction.CENTER_MAP_ON_USER:
      const map = MapUtils();
      if (map) {
        // TODO use a more concise way
        const { followingUser, keepMapCenteredWhenFollowing, loc } = yield select((state: any) => ({
          followingUser: state.ui.flags.followingUser,
          keepMapCenteredWhenFollowing: state.options.keepMapCenteredWhenFollowing,
          loc: state.loc,
        }))
        const bounds = yield call(map.getVisibleBounds as any);
        if (followingUser && loc && (keepMapCenteredWhenFollowing || !utils.locWellBounded(loc, bounds))) {
          yield put(newAction(appAction.CENTER_MAP_ON_USER));
        }
      }
    } catch (err) {
      log.error('geolocation', err);
    }
  },

  setGeolocationMode: function* (action: Action) {
    try {
      const id = action.params as number;
      yield put(newAction(reducerAction.SET_APP_OPTION, { name: 'geolocationModeId', value: id }));

      // And here is the side-effect that belongs outside the reducer:
      Geo.setGeolocationMode(id);
    } catch (err) {
      log.error('setGeolocationMode', err);
    }
  },

  // Stop following user after panning the map.
  userMovedMap: function* (action: Action) {
    try {
      log.debug('saga userMovedMap');
      yield put(newAction(appAction.STOP_FOLLOWING_USER));
    } catch (err) {
      log.error('userMovedMap', err);
    }
  },

  // Set map bearing to 0 (true north)
  reorientMap: function* () {
    const map = MapUtils();
    if (map) {
      log.debug('saga reorientMap');
      const obj = { heading: 0, duration: constants.map.reorientationTime };
      map.setCamera(obj);
    }
  },

  mapRegionChanged: function* (action: Action) {
    log.trace('saga mapRegionChanged', action.params);
    yield put(newAction(reducerAction.MAP_REGION, action.params as Feature));
    yield put(newAction(reducerAction.UI_FLAG_DISABLE, 'mapMoving'));
  },

  mapRegionChanging: function* (action: Action) {
    log.trace('saga mapRegionChanging', action.params);
    yield put(newAction(reducerAction.UI_FLAG_ENABLE, 'mapMoving'));
  },

  mapTapped: function* (action: Action) {
    log.trace('saga mapTapped', action.params);
    const settingsOpen = yield select((state: AppState) => state.ui.flags.settingsOpen);
    if (settingsOpen) {
      yield put(newAction(reducerAction.UI_FLAG_DISABLE, 'settingsOpen'));
    } else {
      yield put(newAction(reducerAction.UI_FLAG_TOGGLE, 'mapFullScreen'));
    }
  },
}

export default sagas;
