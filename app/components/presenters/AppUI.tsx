import React, {
  Component,
} from 'react';

import {
  SafeAreaView, // TODO this is iOS only
  StyleSheet,
  Text,
  View,
} from 'react-native';

import constants from 'lib/constants';

import MapContainer from 'containers/MapContainer';
import Timeline from 'presenters/Timeline';

const AppStyles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: constants.colors.appBackground,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  text: {
    color: constants.colors.appText,
    fontSize: 14, // this seems to be the default
    padding: 5,
  },
})

class AppUI extends Component {
  public render() {
    const text = 'Hello, world!';
    return (
      <SafeAreaView pointerEvents="box-none" style={AppStyles.safeAreaView}>
        <View>
          <Text style={AppStyles.text}>
            {text}
          </Text>
          {/*<MapContainer />*/}
          <Timeline />
        </View>
      </SafeAreaView>
    )
  }
}

export default AppUI;
