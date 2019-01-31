import React, {
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
const colors = constants.colors.compassButton;
const {
  bottomOffset,
  opacity,
  rightOffset,
  size
} = constants.compassButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    bottom: bottomOffset,
    right: rightOffset,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

interface CompassButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  heading: number;
  marginBottom: number;
}

const CompassButton = (props: CompassButtonProps) => (
  props.heading > constants.compassButton.mapHeadingThreshold ?
    (
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: colors.background,
        bottom: bottomOffset + props.marginBottom,
      }]}
      onPress={props.onPress}
      underlayColor={colors.underlay}
    >
      <FontAwesome5
        color={colors.icon}
        name='compass'
        size={constants.compassButton.size / 2}
      />
    </TouchableHighlight>
    ) : null
)

export default CompassButton;
