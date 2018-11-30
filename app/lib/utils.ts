import { applyMiddleware, createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import {
  Dimensions,
} from 'react-native';

import Reducer from './reducer';
import Sagas from './sagas';

let reduxStore: any; // global singleton Redux store

const utils = {

  // ---SECTION: misc

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
