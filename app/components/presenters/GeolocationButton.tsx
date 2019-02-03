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

const modeIcons = [ 'ghost', 'bullseye', 'running', 'bolt' ];
const modeIconColors = [colors.icon, colors.icon, colors.icon, colors.icon ]; // TODO

const GeolocationButton = (props: GeolocationButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.open ? colors.underlay : colors.background,
      bottom: props.bottomOffset,
      left: props.leftOffset,
    }]}
    onPress={props.onPress}
    underlayColor={props.open ? colors.background : colors.underlay}
  >
    <FontAwesome5
      color={modeIconColors[props.mode]}
      name={modeIcons[props.mode]}
      size={constants.geolocationButton.size / 2}
    />
  </TouchableHighlight>
)

export default GeolocationButton;
