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

import GeolocationButton from 'presenters/GeolocationButton';
import HelpButton from 'presenters/HelpButton';
import MapContainer from 'containers/MapContainer';
import SettingsButton from 'presenters/SettingsButton';
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
          <GeolocationButton onPress={() => { }} />
          <HelpButton onPress={() => {}} />
          <SettingsButton onPress={() => { }} />
          <Timeline />
        </View>
      </SafeAreaView>
    )
  }
}

export default AppUI;
