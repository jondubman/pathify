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

import GeolocationPanelContainer from 'containers/GeolocationPanelContainer';
import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import TimelineContainer from 'containers/TimelineContainer';

import CompassButtonContainer from 'containers/CompassButtonContainer';
import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';

const AppStyles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
})

interface Props {
  showTimeline: boolean;
}

class AppUI extends Component<Props> {
  public render() {
    const showTimeline = this.props.showTimeline;
    return (
      <View style={AppStyles.safeAreaView}>
        <StatusBar
          backgroundColor={constants.colors.byName.navy}
          barStyle="light-content"
        />
        <SafeAreaView style={{flex: 1}}>
          <MapContainer />

          <HelpButtonContainer />
          <SettingsPanelContainer />
          <GeolocationPanelContainer />
          <FollowMeButtonContainer />
          <CompassButtonContainer />

          {showTimeline ? <TimelineContainer /> : null}
        </SafeAreaView>
      </View>
    )
  }
}

export default AppUI;
