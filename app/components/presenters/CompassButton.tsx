import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
const colors = constants.colors.compassButton;
const {
  leftOffset,
  opacity,
  size
} = constants.compassButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    left: leftOffset,
    paddingTop: size / 4,
    position: 'absolute',
    opacity,
    width: size,
  },
})

import { CompassButtonProps } from 'containers/CompassButtonContainer';

const CompassButton = (props: CompassButtonProps) => (props.hidden ? null : (
  props.heading && props.heading > constants.compassButton.mapHeadingThreshold ?
    (
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.reorienting ? colors.underlay : colors.background,
        bottom: props.bottomOffset + constants.buttonBaseOffsetPerRow,
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
))

export default React.memo(CompassButton);
