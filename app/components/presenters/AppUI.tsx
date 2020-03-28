import React, {
  Component,
  Fragment,
} from 'react';

import {
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { createSelector } from 'reselect'

import constants from 'lib/constants';
import utils from 'lib/utils';
import log from 'shared/log';

import ActivityInfoContainer from 'containers/ActivityInfoContainer';
import { AppUIProps } from 'containers/AppUIContainer';
import CompassButtonContainer from 'containers/CompassButtonContainer';
import FollowButtonsContainer from 'containers/FollowButtonsContainer';
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
    position: 'absolute',
  },
})

// Using reselect to cache dynamic styles and avoid using inline styles (which force redundant renders.)

const makeFullScreenStyle = () => ({
  position: 'absolute',
  width: utils.windowSize().width,
})
export const fullScreenStyle = createSelector(
  [makeFullScreenStyle],
  (ignore) => (makeFullScreenStyle())
)

const makeAboveTimelineStyle = (props: AppUIProps): any => ({
  bottom: props.timelineHeight,
  position: 'absolute',
  width: utils.windowSize().width,
})
export const aboveTimelineStyle = createSelector(
  [makeAboveTimelineStyle],
  (props: AppUIProps) => (makeAboveTimelineStyle(props))
)

class AppUI extends Component<AppUIProps> {

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
  }

  // TODO is this helpful?
  componentDidCatch(error: any, info: any) {
    log.error('AppUI componentDidCatch', error, info);
  }

  render() {
    const {
      introMode,
      mapFullScreen,
      showActivityInfo,
      showTimeline,
    } = this.props;
    const pointerEvents = showTimeline ? 'auto' : 'none';
    const timelineOpacity = { opacity: showTimeline ? 1 : 0 };
    return (
      <View style={AppStyles.containingAppView}>
        <StatusBar
          backgroundColor={constants.colors.appBackground}
          barStyle="light-content"
        />
        <View style={AppStyles.mainAppView}>
          <MapAreaContainer />
          <View style={AppStyles.logo} />
          {showActivityInfo ? <ActivityInfoContainer /> : null}
          <View pointerEvents={pointerEvents} style={timelineOpacity}>
            <TimelineScrollContainer />
          </View>
          {mapFullScreen ? null : (
            <Fragment>
              <View style={aboveTimelineStyle(this.props) as ViewStyle}>
                <CompassButtonContainer />
                <FollowButtonsContainer />
              </View>
              <TimelineControlsContainer />
              <View style={fullScreenStyle(this.props) as ViewStyle}>
                <HelpPanelContainer />
                <SettingsPanelContainer />
                <TopMenuContainer />
              </View>
              <StartMenuContainer />
              <View style={aboveTimelineStyle(this.props) as ViewStyle}>
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
