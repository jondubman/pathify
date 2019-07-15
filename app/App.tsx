import React, { Component } from 'react';
import {
  AppRegistry,
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
import log from 'shared/log';

import AppUIContainer from 'containers/AppUIContainer';

export default class App extends Component {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    log.info('----- App starting up! (device log)');
    log.debug('windowSize', utils.windowSize());
    store.create(); // proactively create Redux store instance

    Geo.initializeGeolocation(store);
    Geo.resetOdometer();
    store.dispatch(newAction(AppAction.startFollowingUser));

    store.dispatch(newAction(AppAction.loadEventsFromStorage));

    const interval = setInterval(() => {
      store.dispatch(newAction(AppAction.timerTick, utils.now()));
    }, store.getState().options.timerTickIntervalMsec);
    store.dispatch(newAction(ReducerAction.SET_TIMER_TICK_INTERVAL, interval));

    pollServer();
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
