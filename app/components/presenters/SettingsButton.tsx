import React, {
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import constants from 'lib/constants';
const colors = constants.colors.settingsButton;
const { leftOffset, opacityWhenClosed, opacityWhenOpen, size, topOffset } = constants.settingsButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    left: leftOffset,
    top: topOffset,
    justifyContent: 'center',
    flexDirection: 'row',
  },
})

interface SettingsButtonProps {
  open: boolean;
  onPress: (event: GestureResponderEvent) => void;
}

const SettingsButton = (props: SettingsButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.open ? colors.underlay : colors.background,
      opacity: props.open ? opacityWhenOpen : opacityWhenClosed,
    }]}
    onPress={props.onPress}
    underlayColor={props.open ? colors.background : colors.underlay}
  >
    <Icon
      color={colors.icon}
      name='cogs'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default SettingsButton;
