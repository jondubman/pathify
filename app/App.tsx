import React, { Component } from 'react';
import {
  AppRegistry,
  AppState as RNAppState, // Rename built-in AppState; would rather use AppState to refer to the Redux application state
} from 'react-native';
// import FontAwesome5 from 'react-native-vector-icons';
import { Provider } from 'react-redux';

// Note the following transformer, along with package.json files containing a name property, enables import from lib/* etc.
// https: //www.npmjs.com/package/react-native-typescript-transformer
// This is referenced in getTransformModulePath in rn-cli.config.js.

import {
  AppAction,
  newAction,
  ReducerAction
} from 'lib/actions';
import constants from 'lib/constants';
import database, { LogMessageData } from 'lib/database';
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
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  componentDidMount() {
    try {
      store.create(); // proactively create Redux store instance
      const { flags } = store.getState();
      log.setEnabled(flags.logInDebugVersion, flags.logInProductionVersion);
      if (flags.logToDatabase) {
        log.registerCallback((level: string, ...args) => {
          const message: LogMessageData = {
            t: utils.now(),
            level,
            items: [...args].map((arg: any) => JSON.stringify(arg)),
          }
          setTimeout(() => { // avoid blocking
            database.appendLogMessage(message);
          }, 0);
        })
      }
      log.info('----- App starting up! (device log)');
      log.info('windowSize', utils.windowSize());
      log.info('safeAreaTop', constants.safeAreaTop, 'safeAreaBottom', constants.safeAreaBottom);
      RNAppState.addEventListener('change', this.handleAppStateChange);
      store.dispatch(newAction(AppAction.startupActions));

      // For react-native-vector-icons if use_frameworks in Podfile
      // See https://awesomeopensource.com/project/oblador/react-native-vector-icons
      // log.debug('FontAwesome5', FontAwesome5);
      // if ((FontAwesome5 as any).loadFont) {
      //   log.debug('react-native-vector-icons loadFont');
      //   (FontAwesome5 as any).loadFont();
      // }

      const interval = setInterval(() => {
        const { flags } = store.getState();
        if (flags.appActive && flags.ticksEnabled) { // no need for timer ticks in the background
          store.dispatch(newAction(AppAction.timerTick, utils.now()));
        }
      }, store.getState().options.timerTickIntervalMsec);
      store.dispatch(newAction(ReducerAction.SET_TIMER_TICK_INTERVAL, interval));
      setTimeout(pollServer, 0); // attempt to stay in contact with server TODO always do this in the background?
    } catch (err) {
      log.warn('App componentDidMount err', err);
    }
  }

  // TODO does this ever really happen, or need to?
  componentWillUnmount() {
    log.info('removing event listener for handleAppStateChange');
    // RNAppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(newState: string) {
    log.debug('app state change:', newState);
    store.dispatch(newAction(AppAction.appStateChange, { newState: mapNewStateToAppStateChange[newState] }));
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
