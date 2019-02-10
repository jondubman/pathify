import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import constants from 'lib/constants';
import utils from 'lib/utils';
import { TimelineControlsProps } from 'containers/TimelineControlsContainer';

const Styles = StyleSheet.create({
  topLine: {
    backgroundColor: constants.colors.timeline.topLine,
    position: 'absolute',
    width: utils.windowSize().width,
    height: constants.timeline.topLineHeight,
  },
})

const TimelineControls = (props: TimelineControlsProps) => (
  <View>
    <View style={[Styles.topLine, { bottom: props.bottom }]} />
    <View style={[Styles.topLine, { bottom: props.bottom + 2 * constants.timeline.topLineHeight }]} />
    <View style={[Styles.topLine, { bottom: props.bottom + 4 * constants.timeline.topLineHeight }]} />
  </View>
)

export default TimelineControls;
