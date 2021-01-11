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
import { UICategory } from 'lib/intro';

const AppStyles = StyleSheet.create({
  containingAppView: {
    backgroundColor: constants.colors.appBackground,
    flex: 1,
  },
  logo: {
    height: 25, // Note higher# lowers default position of Mapbox logo and attribution
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
      movieMode,
      showActivityInfo,
      showGrabBar,
      showTimeline,
      timelineHeight,
      ui,
    } = this.props;
    const pointerEvents = showTimeline ? 'auto' : 'none';
    const timelineOpacity = { opacity: showTimeline ? 1 : 0 };
    const width = utils.windowSize().width;
    const hideStatusBar = mapFullScreen || movieMode;
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
          hidden={hideStatusBar}
        />
        <View style={AppStyles.mainAppView}>
          <MapAreaContainer />
          {introMode ? <IntroContainer /> : null}
          <View pointerEvents="none" style={AppStyles.logo} />
          <View pointerEvents={pointerEvents} style={timelineOpacity}>
            <TimelineScrollContainer />
          </View>
          {showGrabBar ? <GrabBarContainer /> : null}
          {/* ActivityInfoContainer hidden in mapFullScreen, but keep it alive so it can be shown quickly later */}
          {ui.includes(UICategory.activities) ? (
            <View style={{ position: 'absolute', width }}>
              {showActivityInfo ? <ActivityInfoContainer /> : null}
            </View>
          ) : null}
          {mapFullScreen ?
            <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
              {ui.includes(UICategory.follow) ? (
                <FollowButtonsContainer />
              ) : null}
            </View>
            :
            <Fragment>
              <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
                <CompassButtonContainer />
                {ui.includes(UICategory.follow) ? (
                  <FollowButtonsContainer />
                ) : null}
              </View>
              {/* TimelineControls (including ZoomClock) can appear even if Timeline itself hidden */}
              {ui.includes(UICategory.timelineControls) ? <TimelineControlsContainer /> : null}
              <View style={{ position: 'absolute', width }}>
                {ui.includes(UICategory.help) ? (
                    <HelpPanelContainer /> // includes HelpButton
                  ) : null}
                {ui.includes(UICategory.settings) ? (
                  <SettingsPanelContainer /> // includes SettingsButton
                ) : null}
              </View>
              {ui.includes(UICategory.start) ? (
                <Fragment>
                  <StartMenuContainer />
                  <View style={{ bottom: timelineHeight, position: 'absolute', width }}>
                    <StartButtonContainer />
                  </View>
                </Fragment>
              ) : null}
            </Fragment>
          }
          {ui.includes(UICategory.activities) ? (
            <View style={{ position: 'absolute', width }}>
              {mapFullScreen ? null : <TopMenuContainer />}
            </View>
          ) : null}
        </View>
      </View>
    )
  }
}

export default AppUI;
