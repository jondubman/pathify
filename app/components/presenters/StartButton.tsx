import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
} from 'react-native';

import constants from 'lib/constants';
const colors = constants.colors.startButton;
const {
  leftOffset,
  opacity,
  size,
} = constants.startButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    paddingTop: size / 4,
    position: 'absolute',
    opacity,
    width: size,
  },
  label: {
    color: constants.colors.byName.black,
    fontFamily: constants.fonts.family,
    fontSize: 16,
    paddingTop: 2,
  },
})

// const modeIcons = ['ghost', 'bullseye', 'running', 'bolt']; // also 'play'

import { StartButtonProps } from 'containers/StartButtonContainer';

const StartButton = (props: StartButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.enabled ? colors.enabledBackground : colors.disabledBackground,
      bottom: props.bottomOffset,
      left: leftOffset,
    }]}
    onPress={props.enabled ? props.onStop : props.onStart}
    underlayColor={props.enabled ? colors.enabledUnderlay : colors.disabledUnderlay}
  >
    {props.enabled ? (
      <FontAwesome5
        color={constants.colors.byName.black}
        name={'stop'}
        size={constants.startButton.size / 2}
      />
    ) : (
      <Text style={Styles.label}>
        {'START'}
      </Text>
    )}
  </TouchableHighlight>
)

export default StartButton;
