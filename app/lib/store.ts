import {
  applyMiddleware,
  createStore,
  Store,
} from 'redux';
import createSagaMiddleware from 'redux-saga';

import {
  Action,
} from 'lib/actions';

import reducer, {
  AppOptions,
  AppState,
  AppUIState
} from 'lib/reducer';
import sagas from 'lib/sagas';

let reduxStore: Store<AppState, Action>; // global singleton Redux store

const store = {

  create: (): object => {
    // create once; create() is idempotent.
    if (!reduxStore) {
      const sagaMiddleware = createSagaMiddleware();
      reduxStore = createStore<AppState, Action, {}, {}>(reducer, applyMiddleware(sagaMiddleware));
      sagaMiddleware.run(sagas.root);
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

  uiState: (): AppUIState => {
    store.create();
    return reduxStore.getState().ui;
  }
}

export type Store = typeof store;

export default store;
