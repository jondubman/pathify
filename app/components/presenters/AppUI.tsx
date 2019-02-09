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

import HelpButtonContainer from 'containers/HelpButtonContainer';
import MapContainer from 'containers/MapContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import TimelineContainer from 'containers/TimelineContainer';

const AppStyles = StyleSheet.create({
  containingAppView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
  safeAreaView: {
    flex: 1,
    flexDirection: 'column',
  },
})

interface Props {
  showTimeline: boolean;
}

class AppUI extends Component<Props> {
  public render() {
    const showTimeline = this.props.showTimeline;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.byName.navy}
          barStyle="light-content"
        />
        <SafeAreaView style={AppStyles.safeAreaView}>
          <MapContainer />
          {showTimeline ? <TimelineContainer /> : null}

          <HelpButtonContainer />
          <SettingsPanelContainer />
        </SafeAreaView>
      </View>
    )
  }
}

export default AppUI;
