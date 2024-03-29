import _ from 'lodash'; // for _.throttle

import React, { Component } from 'react';
import {
  AppRegistry,
  AppState as RNAppState, // Rename built-in AppState; would rather use AppState to refer to the Redux application state
  LogBox,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import FontAwesome5 from 'react-native-vector-icons';
import { Provider } from 'react-redux';

import {
  ExportedActivity,
} from 'lib/activities';
import { dynamicAreaTop } from 'lib/selectors';

LogBox.ignoreAllLogs(true); // Note this only disables notifications, not uncaught errors.

// Note the following transformer, along with package.json files with a name property, enables import from lib/* etc.
// https: //www.npmjs.com/package/react-native-typescript-transformer
// This is referenced in getTransformModulePath in rn-cli.config.js.

import {
  AppAction,
  newAction,
  ReducerAction
} from 'lib/actions';
import { AppStateChange } from 'lib/appEvents';
import constants from 'lib/constants';
import database, { LogMessageData } from 'lib/database';
import store from 'lib/store';
import utils from 'lib/utils';
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
    this.handleAppStateChange = this.handleAppStateChange.bind(this); // active, background, etc.
  }

  componentDidMount() {
    try {
      store.create(); // proactively create Redux store instance
      const state = store.getState();
      const { flags } = state;      
      let { devMode } = flags;
      // Configure logging
      log.setEnabled(flags.logInDebugVersion, flags.logInProductionVersion);

      // Start logging
      log.info('----- App starting up! (device log)');
      log.info('windowSize', utils.windowSize());
      log.info('windowHeightFactor', utils.windowHeightFactor());
      log.info('windowWidthFactor', utils.windowWidthFactor());
      RNAppState.addEventListener('change', this.handleAppStateChange);

      // Log incoming properties
      const { props } = this as any;
      const { appBuild, appVersion, automate, develop, foo, manual, test } = props;

      log.info('appVersion', appVersion); // set in AppDelegate.m
      log.info('appBuild', appBuild); // set in AppDelegate.m
      log.info('automate', automate, 'manual', manual);
      log.info('develop', develop); // set (maybe) in XCode build scheme
      log.info('foo', foo); // set in AppDelegate.m
      log.info('test', test); // set in loadSampleData in PathifyNative.swift
      log.info('dynamicAreaTop', dynamicAreaTop(state))
      store.dispatch(newAction(AppAction.setAppOption, { appBuild, appVersion }));

      if (devMode || develop === 'true') {
        store.dispatch(newAction(AppAction.flagEnable, 'devMode'));
        log.warn('devMode enabled');
        devMode = true;
      }
      if (test) {
        store.dispatch(newAction(AppAction.flagEnable, 'testMode'));
        utils.setTestMode(true);
        log.warn('testMode enabled');
      }
      const samples = [] as Array<ExportedActivity>;
      for (let i = 0; ; i++) {
        const name = `sample${i}`;
        if (props[name]) {
          const sample = JSON.parse(props[name]) as ExportedActivity;
          // log.trace(name, sample.activity);
          samples.push(sample);
        } else {
          break;
        }
      }
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
      if (automate && !manual) {
        store.dispatch(newAction(AppAction.flagEnable, 'automate'));
        store.dispatch(newAction(AppAction.startupActions, { include: samples })); // will launch automated test if needed
      } else {
        store.dispatch(newAction(AppAction.startupActions));
      }

      // Configure the timerTick interval, used for clocks etc.
      const interval = setInterval(() => {
        const { flags } = store.getState();
        if (flags.appActive && flags.ticksEnabled) { // no need for timer ticks when runing in the background
          const now = utils.now();
          // Optimization: Throttle upstream of the store.dispatch when tracking
          if (flags.trackingActivity) {
            _.throttle(() => {
              store.dispatch(newAction(AppAction.timerTick, now));
            }, constants.timing.tickThrottleWhileTracking)();
          } else {
            store.dispatch(newAction(AppAction.timerTick, now)); // call directly
          }
        }
      }, store.getState().options.timerTickIntervalMsec);
      store.dispatch(newAction(ReducerAction.SET_TIMER_TICK_INTERVAL, interval));
    } catch (err) {
      log.warn('App componentDidMount err', err);
    }
  }

  // TODO does this ever really happen?
  componentWillUnmount() {
    log.info('componentWillUnmount; removing event listener for handleAppStateChange');
    // RNAppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(newState: string) {
    log.debug('app state change:', newState);
    store.dispatch(newAction(AppAction.appStateChange, {
      newState: mapNewStateToAppStateChange[newState]
    }))
  }

  render() {
    return (
      <Provider store={store.create() as any}>
        <SafeAreaProvider>
          <AppUIContainer />
        </SafeAreaProvider>
      </Provider>
    )
  }
}

AppRegistry.registerComponent('app', () => App as any);
