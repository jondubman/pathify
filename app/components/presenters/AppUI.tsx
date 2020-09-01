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
import CompassButtonContainer from 'containers/CompassButtonContainer';
import FollowButtonsContainer from 'containers/FollowButtonsContainer';
import GrabBarContainer from 'containers/GrabBarContainer';
import HelpPanelContainer from 'containers/HelpPanelContainer';
import IntroContainer from 'containers/IntroContainer';
import MapAreaContainer from 'containers/MapAreaContainer';
import SettingsPanelContainer from 'containers/SettingsPanelContainer';
import StartButtonContainer from 'containers/StartButtonContainer';
import StartMenuContainer from 'containers/StartMenuContainer';
import TimelineControlsContainer from 'containers/TimelineControlsContainer';
import TimelineScrollContainer from 'containers/TimelineScrollContainer';
import TopMenuContainer from 'containers/TopMenuContainer';

const AppStyles = StyleSheet.create({
  containingAppView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
  logo: {
    height: 30, // TODO higher# lowers default position of Mapbox logo and attribution
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
      introMode,
      mapFullScreen,
      showActivityInfo,
      showGrabBar,
      showTimeline,
      timelineHeight,
    } = this.props;
    const pointerEvents = showTimeline ? 'auto' : 'none';
    const timelineOpacity = { opacity: showTimeline ? 1 : 0 };
    const width = utils.windowSize().width;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
        />
        <View style={AppStyles.mainAppView}>
          <MapAreaContainer />
          <View style={AppStyles.logo} />
          <View pointerEvents={pointerEvents} style={timelineOpacity}>
            <TimelineScrollContainer />
          </View>
          {showGrabBar ? <GrabBarContainer /> : null}
          {mapFullScreen ?
            null
            :
            (<Fragment>
              <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
                <CompassButtonContainer />
                <FollowButtonsContainer />
              </View>
              <TimelineControlsContainer />
              <View style={{ position: 'absolute', width }}>
                <TopMenuContainer />
                {showActivityInfo ? <ActivityInfoContainer /> : null}
                <HelpPanelContainer />
                <SettingsPanelContainer />
              </View>
              <StartMenuContainer />
              <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
                <StartButtonContainer />
              </View>
            </Fragment>
          )}
        </View>
        {introMode ? <IntroContainer /> : null}
      </View>
    )
  }
}

export default AppUI;
