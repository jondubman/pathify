// simple singleton Redux store

import {
  applyMiddleware,
  createStore,
  Store,
} from 'redux';
import createSagaMiddleware from 'redux-saga';

import {
  Action,
} from 'lib/actions';

import reducer from 'lib/reducer';
import sagas from 'lib/sagas';
import {
  AppState,
} from 'lib/state';

let reduxStore: Store<AppState, Action>; // global singleton Redux store

const store = {

  create: (): object => {
    // create once; create() is idempotent.
    if (!reduxStore) {
      const sagaMiddleware = createSagaMiddleware();
      // Note use of template here.
      reduxStore = createStore<AppState, Action, {}, {}>(reducer, applyMiddleware(sagaMiddleware));
      sagaMiddleware.run(sagas.root);
    }
    return reduxStore;
  },

  // wrapper with guard
  dispatch: (action: Action) => {
    store.create();
    reduxStore.dispatch(action);
  },

  // wrapper with guard
  getState: (): AppState => {
    store.create(); // guard
    return reduxStore.getState();
  },
}

export type Store = typeof store;

export default store;
