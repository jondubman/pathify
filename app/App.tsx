import React, { Component } from 'react';
import {
  AppRegistry,
  AppState as RNAppState, // would rather use AppState to refer to the Redux application state
} from 'react-native';
import { Provider } from 'react-redux';

// Note the following transformer, along with package.json files containing a name property, enables import from lib/* etc.
// https: //www.npmjs.com/package/react-native-typescript-transformer
// This is referenced in getTransformModulePath in rn-cli.config.js.

import { AppAction, newAction, ReducerAction } from 'lib/actions';
import { Geo } from 'lib/geo';
import { pollServer } from 'lib/server';
import store from 'lib/store';
import utils from 'lib/utils';
import { AppStateChangeEvent, AppStateChange } from 'shared/appEvents';
import log from 'shared/log';

import AppUIContainer from 'containers/AppUIContainer';
import { EventType } from 'shared/timeseries';

const mapNewStateToAppStateChange = {
  startup: AppStateChange.STARTUP,
  active: AppStateChange.ACTIVE,
  background: AppStateChange.BACKGROUND,
  inactive: AppStateChange.INACTIVE,
}

const newAppStateChangeEvent = (newState: string): AppStateChangeEvent => ({
  t: utils.now(),
  type: EventType.APP,
  data: {
    newState: mapNewStateToAppStateChange[newState] || `unknown new app state: ${newState}`,
  },
})

export default class App extends Component {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    log.info('----- App starting up! (device log)');
    log.debug('windowSize', utils.windowSize());
    store.create(); // proactively create Redux store instance

    RNAppState.addEventListener('change', this.handleAppStateChange);

    Geo.initializeGeolocation(store);
    Geo.resetOdometer();
    store.dispatch(newAction(AppAction.startFollowingUser));

    const { startupAction_clearStorage, startupAction_loadStorage } = store.getState().flags;
    if (startupAction_clearStorage) {
      store.dispatch(newAction(AppAction.clearStorage));
    }
    if (startupAction_loadStorage) {
      store.dispatch(newAction(AppAction.loadEventsFromStorage));
    }
    this.handleAppStateChange('startup'); // initialize

    const interval = setInterval(() => {
      store.dispatch(newAction(AppAction.timerTick, utils.now()));
    }, store.getState().options.timerTickIntervalMsec);
    store.dispatch(newAction(ReducerAction.SET_TIMER_TICK_INTERVAL, interval));

    pollServer();
  }

  componentWillUnmount() {
    RNAppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(newState: string) {
    log.debug('app state change:', newState);
    store.dispatch(newAction(AppAction.addEvents, { events: [ newAppStateChangeEvent(newState) ]}));
  }

  render() {
    return (
      <Provider store={store.create() as any}>
        <AppUIContainer />
      </Provider>
    )
  }
}

AppRegistry.registerComponent('app', () => App as any);
