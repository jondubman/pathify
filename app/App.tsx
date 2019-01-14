import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';

// Note the following transformer, along with package.json files containing a name property, enables import from lib/* etc.
// https: //www.npmjs.com/package/react-native-typescript-transformer
// This is referenced in getTransformModulePath in rn-cli.config.js.

import store from 'lib/store';
import utils from 'lib/utils';

import AppUIContainer from 'containers/AppUIContainer';

export default class App extends Component {
  constructor(props: any) {
    super(props);
    utils.onAppStart(); // TODO is this the right place for this?
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
