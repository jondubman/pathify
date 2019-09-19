import React, {
  Component,
} from 'react';

import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

import { AppUIProps } from 'containers/AppUIContainer';
import CompassButtonContainer from 'containers/CompassButtonContainer';
import DebugInfoContainer from 'containers/DebugInfoContainer';
import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';
import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import PopupMenusContainer from 'containers/PopupMenusContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import TimelineControlsContainer from 'containers/TimelineControlsContainer';
import TimelineScrollContainer from 'containers/TimelineScrollContainer';

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
    const {
      showDebugInfo,
      showTimeline,
      timelineHeight
    } = this.props;
    const width = utils.windowSize().width;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
        />
        <View style={AppStyles.safeAreaView}>
          <MapContainer />
          {showTimeline ? <TimelineScrollContainer /> : null}
          <PopupMenusContainer />
          {showDebugInfo ? <DebugInfoContainer /> : null}
          <TimelineControlsContainer />
          <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
            <CompassButtonContainer />
            <FollowMeButtonContainer />
            <GeolocationButtonContainer />
          </View>
          <HelpButtonContainer />
          <SettingsPanelContainer />
        </View>
      </View>
    )
  }
}

export default AppUI;
