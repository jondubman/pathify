// This component renders the Clock, RefTime, top lines and center line of the timeline.

import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

import PausedClockContainer from 'containers/PausedClockContainer';
import NowClockContainer from 'containers/NowClockContainer';
import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';

// TODO this fiddly magic number, determined empirically, positions well across all devices, but is nonintuitive.
// This succeeds at positioning the nowClock between the center clock and the follow button.
const clockLeftFactor = 0.714;
const clockRightFactor = 0.728;

const Styles = StyleSheet.create({
  centerLine: {
    backgroundColor: constants.colors.timeline.centerLine,
    bottom: constants.timeline.bottomPaddingForAxis,
    left: utils.windowSize().width / 2 - constants.timeline.centerLineWidth / 2,
    position: 'absolute',
    width: constants.timeline.centerLineWidth,
  },
  clockCenter: {
    left: utils.windowSize().width / 2 - constants.clock.height / 2,
    position: 'absolute',
  },
  clockLeft: {
    right: (utils.windowSize().width * clockLeftFactor) - constants.clock.height / 2,
    position: 'absolute',
  },
  clockRight: {
    left: (utils.windowSize().width * clockRightFactor) - constants.clock.height / 2,
    position: 'absolute',
  },
  topLine: {
    backgroundColor: constants.colors.timeline.topLine,
    position: 'absolute',
    width: utils.windowSize().width,
    height: constants.timeline.topLineHeight,
  },
})

const TimelineControls = (props: TimelineControlsProps) => (
  <View>
    <View style={[props.nowMode ? Styles.clockLeft : Styles.clockCenter, { bottom: props.timelineHeight + constants.refTime.height + 1 }]}>
      <PausedClockContainer  />
    </View>
    <View style={[props.nowMode ? Styles.clockCenter : Styles.clockRight, { bottom: props.timelineHeight + constants.refTime.height + 1 }]}>
      <NowClockContainer />
    </View>
    <RefTimeContainer />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 2 * constants.timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 4 * constants.timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.centerLine, {
      height: props.timelineHeight
              + constants.refTime.height
              + constants.refTime.bottomMargin
              - constants.timeline.bottomPaddingForAxis
    }]} />
  </View>
)

export default React.memo(TimelineControls); // Note use of memo (optimization based on shallow comparison of props)

