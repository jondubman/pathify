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
import constants from 'lib/constants';
import database from 'lib/database';
import { Geo } from 'lib/geo';
import { pollServer } from 'lib/server';
import store from 'lib/store';
import utils from 'lib/utils';
import { AppStateChange } from 'shared/appEvents';
import log from 'shared/log';

import AppUIContainer from 'containers/AppUIContainer';

const mapNewStateToAppStateChange = {
  startup: AppStateChange.STARTUP,
  active: AppStateChange.ACTIVE,
  background: AppStateChange.BACKGROUND,
  inactive: AppStateChange.INACTIVE,
}

export default class App extends Component {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    log.info('----- App starting up! (device log)');
    log.info('windowSize', utils.windowSize());
    log.info('safeAreaTop', constants.safeAreaTop, 'safeAreaBottom', constants.safeAreaBottom);
    store.create(); // proactively create Redux store instance

    RNAppState.addEventListener('change', this.handleAppStateChange);

    const interval = setInterval(() => {
      const { flags } = store.getState();
      if (flags.appActive && flags.ticksEnabled) {
        store.dispatch(newAction(AppAction.timerTick, utils.now()));
      }
    }, store.getState().options.timerTickIntervalMsec);
    store.dispatch(newAction(ReducerAction.SET_TIMER_TICK_INTERVAL, interval));

    this.handleAppStateChange('startup'); // initialize

    store.dispatch(newAction(AppAction.startupActions));

    pollServer(); // attempt to stay in contact with server
  }

  componentWillUnmount() {
    RNAppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(newState: string) {
    log.debug('app state change:', newState);
    store.dispatch(newAction(AppAction.appStateChange, { newState: mapNewStateToAppStateChange[newState] } ));
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
