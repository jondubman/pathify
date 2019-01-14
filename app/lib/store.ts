import {
  applyMiddleware,
  createStore,
} from 'redux';
import createSagaMiddleware from 'redux-saga';

import {
  Action,
  // appAction,
  // newAction,
} from 'lib/actions';

import Reducer, { AppOptions, AppState } from 'lib/reducer';
import Sagas from 'lib/sagas';

let reduxStore; // global singleton Redux store

const store = {

  create: (): object => {
    // create once; create() is idempotent.
    if (!reduxStore) {
      const appReducer = Reducer;
      const sagaMiddleware = createSagaMiddleware();

      reduxStore = createStore(appReducer, applyMiddleware(sagaMiddleware));
      sagaMiddleware.run(Sagas.root);
    }
    return reduxStore;
  },

  dispatch: (action: Action) => {
    store.create();
    reduxStore.dispatch(action);
  },

  getState: (): AppState => {
    store.create();
    return reduxStore.getState();
  },

  options: (): AppOptions => {
    store.create();
    return reduxStore.getState().options;
  },
}

export default store;
