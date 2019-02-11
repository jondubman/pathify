import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';
import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';

const Styles = StyleSheet.create({
  centerLine: {
    alignSelf: 'center',
    backgroundColor: constants.colors.timeline.centerLine,
    bottom: constants.timeline.bottomPaddingForAxis,
    position: 'absolute',
    width: constants.timeline.centerLineWidth,
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
