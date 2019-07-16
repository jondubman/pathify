import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
const colors = constants.colors.geolocationButton;
const {
  opacity,
  size
} = constants.geolocationButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

import { GeolocationButtonProps } from 'containers/GeolocationButtonContainer';

// const modeIcons = [ 'ghost', 'bullseye', 'running', 'bolt' ];

const GeolocationButton = (props: GeolocationButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.enabled ? colors.enabledBackground : colors.disabledBackground,
      bottom: props.bottomOffset,
      left: props.leftOffset,
    }]}
    onPress={props.onPress}
    underlayColor={props.enabled ? colors.enabledUnderlay : colors.disabledUnderlay}
  >
    <FontAwesome5
      color={constants.colors.byName.black}
      name={props.enabled ? 'stop' : 'running'}
      size={constants.geolocationButton.size / 2}
    />
  </TouchableHighlight>
)

export default GeolocationButton;
