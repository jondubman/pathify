import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import {
  Dimensions,
} from 'react-native';

import geo from 'lib/geo';
import log from 'lib/log';
import Reducer from 'lib/reducer';
import Sagas from 'lib/sagas';

let reduxStore: any; // global singleton Redux store

const utils = {

  // ---SECTION: app

  // Once, when app starts up
  onAppStart: () => {
    log.info('----- App starting up! (device log)');
    log.debug('windowSize', utils.windowSize());

    utils.store(); // create Redux store

    geo.initializeGeolocation(); // TODO use return value
  },

  // ---SECTION: misc

  objectWithoutKey: (object: any, key: string) => {
    const { [key]: deletedKey, ...otherKeys } = object;
    return otherKeys;
  },

  windowSize: () => {
    const dim = Dimensions.get('window');
    return dim; // { height, width }
  },

  // ---SECTION: Redux

  store: () => {
    // create once
    if (!reduxStore) {
      const appReducer = Reducer;
      const sagaMiddleware = createSagaMiddleware();

      reduxStore = createStore(appReducer, applyMiddleware(sagaMiddleware));
      sagaMiddleware.run(Sagas.root);
    }
    return reduxStore;
  },
}

export default utils;
