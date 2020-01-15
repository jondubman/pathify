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
import { centerline } from 'lib/selectors';

const { refTime, timeline } = constants;
const colors = constants.colors.timeline;

const Styles = StyleSheet.create({
  centerLine: {
    backgroundColor: colors.centerLine,
    bottom: timeline.bottomPaddingForAxis,
    left: centerline() - timeline.centerLineWidth / 2,
    position: 'absolute',
    width: timeline.centerLineWidth,
  },
  clockCenter: {
    left: centerline() - constants.clock.height / 2,
    position: 'absolute',
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
    <View style={[Styles.clockCenter, { bottom: props.bottom }]}>
      {props.nowMode ? <NowClockContainer interactive={true} /> : <PausedClockContainer interactive={true} />}
    </View>
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
