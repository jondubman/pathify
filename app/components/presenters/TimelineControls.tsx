// This component renders the Clock, RefTime, top lines and center line of the timeline.

import React, {
} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';

import RefTimeContainer from 'containers/RefTimeContainer';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';
import ZoomClockContainer from 'containers/ZoomClockContainer';
import { centerline } from 'lib/selectors';

const { refTime, timeline } = constants;
const colors = constants.colors.timeline;

const Styles = StyleSheet.create({
  centerLine: {
    bottom: timeline.bottomPaddingForAxis,
    left: centerline() - timeline.centerLineWidth / 2,
    position: 'absolute',
    width: timeline.centerLineWidth,
  },
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

const backgroundColorFor = (props: TimelineControlsProps) => {
  if (props.timelineHeight) {
    return (props.zoomClockMoved ? colors.centerLineZoom : colors.centerLine);
  } else {
    return colors.centerLineInert
  }
}

const TimelineControls = (props: TimelineControlsProps) => (
  <View>
    <ZoomClockContainer />
    <View pointerEvents="none">
      <RefTimeContainer />
    </View>
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 2 * timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.topLine, { bottom: props.timelineHeight + 4 * timeline.topLineHeight }]} />
    <View pointerEvents="none" style={[Styles.centerLine, {
      backgroundColor: backgroundColorFor(props),
      height: (props.timelineHeight ? props.timelineHeight : constants.safeAreaBottom)
        + refTime.height + props.zoomClockMoved
        - timeline.bottomPaddingForAxis
        + 1
    }]} />
  </View>
)

export default React.memo(TimelineControls); // Note use of memo (optimization based on shallow comparison of props)

// top: (utils.windowSize().height - props.clockBottom),
