import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';

import utils from './lib/utils';

import AppUIContainer from './components/containers/AppUIContainer';
export default class App extends Component {
  render() {
    return (
      <Provider store={utils.store()}>
        <AppUIContainer />
      </Provider>
    )
  }
}

AppRegistry.registerComponent('app', () => App);
