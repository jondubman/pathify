import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
} from 'react-native';

import constants from 'lib/constants';
const colors = constants.colors.geolocationButton;
const {
  bottomOffset,
  leftOffset,
  opacity,
  size,
} = constants.geolocationButton;

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
    fontFamily: 'Futura',
    // fontWeight: 'bold',
    fontSize: 16,
    paddingTop: 2,
  },
  start: {
  },
  stop: {
  },
})

// import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// const modeIcons = [ 'ghost', 'bullseye', 'running', 'bolt' ];
/*
<FontAwesome5
  color={constants.colors.byName.black}
  name={props.enabled ? 'stop' : 'play'}
  size={constants.geolocationButton.size / 2}
/>
*/
import { GeolocationButtonProps } from 'containers/GeolocationButtonContainer';

const GeolocationButton = (props: GeolocationButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.enabled ? colors.enabledBackground : colors.disabledBackground,
      bottom: bottomOffset,
      left: leftOffset,
    }]}
    onPress={props.onPress}
    underlayColor={props.enabled ? colors.enabledUnderlay : colors.disabledUnderlay}
  >
    <Text style={[ Styles.label, props.enabled ? Styles.stop : Styles.start ]}>
      {props.enabled ? 'STOP' : 'START'}
    </Text>
  </TouchableHighlight>
)

export default GeolocationButton;
