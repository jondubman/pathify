import React, {
  Component,
} from 'react';

import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';

import { AppUIProps } from 'containers/AppUIContainer';
import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import TimelineContainer from 'containers/TimelineContainer';
import TimelineControlsContainer from 'containers/TimelineControlsContainer';

const AppStyles = StyleSheet.create({
  containingAppView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
  safeAreaView: { // TODO this used to be a SafeAreaView; is now just View
    flex: 1,
    flexDirection: 'column',
  },
})

class AppUI extends Component<AppUIProps> {
  public render() {
    const { showTimeline } = this.props;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
        />
        <View style={AppStyles.safeAreaView}>
          <MapContainer />
          {showTimeline ? <TimelineContainer /> : null}
          {showTimeline ? <TimelineControlsContainer /> : null}
          <HelpButtonContainer />
          <SettingsPanelContainer />
        </View>
      </View>
    )
  }
}

export default AppUI;
