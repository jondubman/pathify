import React, {
  Component,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';

import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import TimelineContainer from 'containers/TimelineContainer';

const AppStyles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: constants.colors.appBackground,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
})

class AppUI extends Component {
  public render() {
    return (
      <SafeAreaView pointerEvents="box-none" style={AppStyles.safeAreaView}>
        <View>
          <StatusBar
            backgroundColor={constants.colors.byName.navy}
            barStyle="light-content"
          />
          <MapContainer />
          <GeolocationButtonContainer />
          <HelpButtonContainer />
          <SettingsButtonContainer />
          <TimelineContainer />
        </View>
      </SafeAreaView>
    )
  }
}

export default AppUI;
