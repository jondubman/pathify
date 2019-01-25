import React, {
  Component,
} from 'react';

import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import SafeAreaView from 'react-native-safe-area-view-with-get-inset';

import constants from 'lib/constants';

import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import TimelineContainer from 'containers/TimelineContainer';

import CompassButtonContainer from 'containers/CompassButtonContainer';
import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';

const AppStyles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
})

class AppUI extends Component {
  public render() {
    return (
      <View style={AppStyles.safeAreaView}>
        <StatusBar
          backgroundColor={constants.colors.byName.navy}
          barStyle="light-content"
        />
        <SafeAreaView style={{flex: 1}}>
          <MapContainer />

          <HelpButtonContainer />
          <SettingsButtonContainer />
          <GeolocationButtonContainer />
          <FollowMeButtonContainer />
          <CompassButtonContainer />

          <TimelineContainer />
        </SafeAreaView>
      </View>
    )
  }
}

export default AppUI;
