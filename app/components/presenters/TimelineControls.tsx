import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

import ClockContainer from 'containers/ClockContainer';
import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';

const Styles = StyleSheet.create({
  centerLine: {
    // alignSelf: 'center',
    backgroundColor: constants.colors.timeline.centerLine,
    bottom: constants.timeline.bottomPaddingForAxis,
    left: utils.windowSize().width / 2 - constants.timeline.centerLineWidth / 2,
    position: 'absolute',
    width: constants.timeline.centerLineWidth,
  },
  clock: {
    // alignSelf: 'center',
    left: utils.windowSize().width / 2 - constants.clock.height / 2,
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
    <View style={[Styles.clock, { bottom: props.timelineHeight + constants.refTime.height + 1 }]}>
      <ClockContainer  />
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

export default TimelineControls;
