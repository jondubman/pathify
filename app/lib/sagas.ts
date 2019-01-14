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

const Sagas = {
  root: function* () {
    yield takeEvery(appAction.CENTER_MAP_ON_USER, Sagas.centerMapOnUser);
    yield takeEvery(appAction.GEOLOCATION, Sagas.geolocation);
    yield takeEvery(appAction.USER_MOVED_MAP, Sagas.userMovedMap);

    yield takeEvery(appAction.START_FOLLOWING_USER, Sagas.startFollowingUser);
    yield takeEvery(appAction.STOP_FOLLOWING_USER, Sagas.stopFollowingUser);
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
      yield put(newAction(reducerAction.FOLLOW_USER));
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
      yield put(newAction(reducerAction.UNFOLLOW_USER));
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
        const { loc, options } = yield select((state: any) => ({ loc: state.loc, options: state.options }));
        const { followingUser } = options;
        const bounds = yield call(map.getVisibleBounds as any);
        if (followingUser && loc && (options.keepMapCenteredWhenFollowing || !utils.locWellBounded(loc, bounds))) {
          yield put(newAction(appAction.CENTER_MAP_ON_USER));
        }
      }
    } catch (err) {
      log.error('geolocation', err);
    }
  },

  // Stop following user after panning the map
  userMovedMap: function* () {
    try {
      log.debug('saga userMovedMap');
      yield put(newAction(appAction.STOP_FOLLOWING_USER));
    } catch (err) {
      log.error('userMovedMap', err);
    }
  },
}

export default Sagas;
