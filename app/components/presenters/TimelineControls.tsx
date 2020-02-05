// This component renders the Clock, RefTime, top lines and center line of the timeline.
// TODO Cleanup ghost clocks

import React, {
  // Fragment,
} from 'react';

import {
  StyleSheet,
  // Text,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

// import GhostClockContainer from 'containers/GhostClockContainer';
import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';
import ZoomClockContainer from 'containers/ZoomClockContainer';
import { centerline } from 'lib/selectors';

const { refTime, timeline } = constants;
const colors = constants.colors.timeline;

// TODO this is sort of inelegant, but effective at finessing the placement of the GhostClock.
// const ghostExtra = () => {
//   const smallSize = 320;
//   const mediumSize = 375;
//   const size = utils.windowSize().width;
//   if (size > mediumSize) {
//    return 23;
//   }
//   if (size > smallSize) {
//     return 14;
//   }
//   return 3;
// }

const Styles = StyleSheet.create({
  centerLine: {
    backgroundColor: colors.centerLine,
    bottom: timeline.bottomPaddingForAxis,
    left: centerline() - timeline.centerLineWidth / 2,
    position: 'absolute',
    width: timeline.centerLineWidth,
  },
  // ghostClockFader: {
  //   opacity: 0.25,
  // },
  // ghostClockNow: { // shows up when timelineNow is false; action enables timelineNow
  //   position: 'absolute',
  //   left: centerline() + clockWidth / 2 + ghostExtra(),
  // },
  // ghostClockNowLabel: {
  //   color: constants.colors.ghostClockLabels.now,
  //   left: 2,
  //   top: 45,
  // },
  // ghostClockPast: { // shows up when timelineNow is true; action disables timelineNow and scrolls back in time
  //   position: 'absolute',
  //   right: centerline() + clockWidth / 2 + ghostExtra(),
  // },
  // ghostClockPastLabel: {
  //   color: constants.colors.ghostClockLabels.past,
  //   top: 45,
  // },
  text: {
    alignSelf: 'center',
    fontFamily: constants.fonts.family,
    fontSize: 16,
    fontWeight: 'bold',
  },
  topLine: {
    backgroundColor: colors.topLine,
    position: 'absolute',
    width: utils.windowSize().width,
    height: timeline.topLineHeight,
  },
})

const TimelineControls = (props: TimelineControlsProps) => (
  <View>
    <ZoomClockContainer />
    {/* {props.timelineScrolling ? null :
      props.nowMode ? (
        <Fragment>
          <View style={[Styles.ghostClockPast, { bottom: props.bottom }]}>
            <Text style={[Styles.text, Styles.ghostClockPastLabel]}>
              BACK
            </Text>
            <View style={Styles.ghostClockFader}>
              <GhostClockContainer interactive={true} key='GhostClockPast' />
            </View>
          </View>
        </Fragment>
      ) : (
        <View style={[Styles.ghostClockNow, { bottom: props.bottom }]}>
          <Fragment>
            <Text style={[Styles.text, Styles.ghostClockNowLabel]}>
              NOW
            </Text>
            <View style={Styles.ghostClockFader}>
              <GhostClockContainer interactive={true} key='GhostClockNow' />
            </View>
          </Fragment>
        </View>
      )
    } */}
    <RefTimeContainer />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 2 * timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 4 * timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.centerLine, {
      height: props.timelineHeight
        + refTime.height
        + refTime.bottomMargin
        - timeline.bottomPaddingForAxis
    }]} />
  </View>
)

export default React.memo(TimelineControls); // Note use of memo (optimization based on shallow comparison of props)
