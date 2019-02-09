import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
import { HelpButtonProps } from 'containers/HelpButtonContainer';

const colors = constants.colors.helpButton;
const { opacity, rightOffset, size, topOffset } = constants.helpButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    right: rightOffset,
    top: topOffset,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

const HelpButton = (props: HelpButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.enabled ? colors.underlay : colors.background,
    }]}
    onPress={props.onPress}
    underlayColor={props.enabled ? colors.background : colors.underlay}
  >
    <FontAwesome5
      color={colors.icon}
      name='lightbulb' // was 'question'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default HelpButton;
