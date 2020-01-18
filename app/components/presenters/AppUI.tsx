import React, {
  Component,
  Fragment,
} from 'react';

import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';
import log from 'shared/log';

import ActivityInfoContainer from 'containers/ActivityInfoContainer';
import { AppUIProps } from 'containers/AppUIContainer';
import ClockMenuContainer from 'containers/ClockMenuContainer';
import CompassButtonContainer from 'containers/CompassButtonContainer';
import DebugInfoContainer from 'containers/DebugInfoContainer';
import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';
import GeoButtonContainer from 'containers/GeoButtonContainer';
import HelpPanelContainer from 'containers/HelpPanelContainer';
import MapAreaContainer from 'containers/MapAreaContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import TimelineControlsContainer from 'containers/TimelineControlsContainer';
import TimelineScrollContainer from 'containers/TimelineScrollContainer';
import TopMenuContainer from 'containers/TopMenuContainer';

const AppStyles = StyleSheet.create({
  containingAppView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
  mainAppView: {
    flex: 1,
    flexDirection: 'column',
  },
})

class AppUI extends Component<AppUIProps> {

  // TODO is this helpful?
  componentDidCatch(error: any, info: any) {
    log.error('AppUI componentDidCatch', error, info);
  }

  render() {
    const {
      mapFullScreen,
      mapTapped,
      showActivityInfo,
      showDebugInfo,
      showTimeline,
      timelineHeight,
    } = this.props;
    const width = utils.windowSize().width;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
        />
        <View style={AppStyles.mainAppView}>
          <MapAreaContainer />
          {mapFullScreen && mapTapped ? null : (<Fragment>
            {showTimeline ? <TimelineScrollContainer /> : null}
            {showActivityInfo ? <ActivityInfoContainer /> : null}
            {showDebugInfo ? <DebugInfoContainer /> : null}
            <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
              {mapFullScreen ? null : <ClockMenuContainer />}
            </View>
            <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
              <CompassButtonContainer />
              <FollowMeButtonContainer />
              <GeoButtonContainer />
            </View>
            {showTimeline ? <TimelineControlsContainer /> : null}
            <View style={{ position: 'absolute', width }}>
              <HelpPanelContainer />
              {mapFullScreen ? null : <TopMenuContainer />}
              <SettingsPanelContainer />
            </View>
          </Fragment>)}
        </View>
      </View>
    )
  }
}

export default AppUI;
