// This component renders the Clock, RefTime, top lines and center line of the timeline.

import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

import GhostClockContainer from 'containers/GhostClockContainer';
import PausedClockContainer from 'containers/PausedClockContainer';
import NowClockContainer from 'containers/NowClockContainer';
import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';
import { centerline } from 'lib/selectors';

const { refTime, timeline } = constants;
const colors = constants.colors.timeline;

const clockWidth = constants.clock.height;
const ghostFudgeLeft = clockWidth + 2;
const ghostFudgeRight = clockWidth - 3;

// TODO this is sort of inelegant, but effective at finessing the placement of the GhostClock.
const ghostExtra = () => {
  const smallSize = 320;
  const mediumSize = 375;
  const size = utils.windowSize().width;
  if (size > mediumSize) {
   return 23;
  }
  if (size > smallSize) {
    return 14;
  }
  return 1;
}

const Styles = StyleSheet.create({
  centerLine: {
    backgroundColor: colors.centerLine,
    bottom: timeline.bottomPaddingForAxis,
    left: centerline() - timeline.centerLineWidth / 2,
    position: 'absolute',
    width: timeline.centerLineWidth,
  },
  clockCenter: {
    left: centerline() - clockWidth / 2,
    position: 'absolute',
  },
  ghostClockNow: { // shows up when timelineNow is false; action enables timelineNow
    position: 'absolute',
    left: (centerline() - clockWidth / 2) + ghostFudgeLeft + ghostExtra(),
  },
  ghostClockPast: { // shows up when timelineNow is true; action disables timelineNow and scrolls back in time
    position: 'absolute',
    right: (centerline() - clockWidth / 2) + ghostFudgeRight + ghostExtra(),
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
      {props.nowMode ? <NowClockContainer interactive={true} key='NowClock' />
        : <PausedClockContainer interactive={true} key='PausedClock' />}
    </View>
    {props.timelineScrolling ? null :
      props.nowMode ? (
        <View style={[Styles.ghostClockPast, { bottom: props.bottom }]}>
          <GhostClockContainer interactive={true} key='GhostClockPast' />
        </View>
      ) : (
        <View style={[Styles.ghostClockNow, { bottom: props.bottom }]}>
          <GhostClockContainer interactive={true} key='GhostClockNow' />
        </View>
      )
    }
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
