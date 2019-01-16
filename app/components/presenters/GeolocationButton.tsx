import React, {
  Fragment,
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
const colors = constants.colors.geolocationButton;
const {
  bottomOffset,
  leftOffset,
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
    bottom: bottomOffset,
    left: leftOffset,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

interface GeolocationButtonProps {
  onPress: (event: GestureResponderEvent) => void;
}

const GeolocationButton = (props: GeolocationButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: colors.background,
    }]}
    onPress={props.onPress as any}
    underlayColor={colors.underlay}
  >
    <FontAwesome5
      color={colors.icon}
      name='ghost'
      size={constants.geolocationButton.size / 2}
    />
  </TouchableHighlight>
)

export default GeolocationButton;
