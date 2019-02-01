import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';
import { Provider } from 'react-redux';

// Note the following transformer, along with package.json files containing a name property, enables import from lib/* etc.
// https: //www.npmjs.com/package/react-native-typescript-transformer
// This is referenced in getTransformModulePath in rn-cli.config.js.

import { appAction, newAction } from 'lib/actions';
import { Geo } from 'lib/geo';
import log from 'lib/log';
import store from 'lib/store';
import utils from 'lib/utils';

import AppUIContainer from 'containers/AppUIContainer';

export default class App extends Component {
  constructor(props: any) {
    super(props);

    // formerly utils.onAppStart:
    log.info('----- App starting up! (device log)');
    log.debug('windowSize', utils.windowSize());
    store.create(); // proactively create Redux store instance
    Geo.initializeGeolocation(store); // TODO use only when needed
    Geo.resetOdometer();
    store.dispatch(newAction(appAction.START_FOLLOWING_USER));
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
