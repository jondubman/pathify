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
const { opacity, size } = constants.settingsButton;

const Styles = StyleSheet.create({
  button: {
    // position, shape (circular) and size
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    left: 2,
    top: 2,
    justifyContent: 'center',
    flexDirection: 'row',

    // appearance
    opacity,
  },
})

interface SettingsButtonProps {
  onPress: (event: GestureResponderEvent) => void;
}

const SettingsButton = (props: SettingsButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: colors.background,
    }]}
    onPress={props.onPress}
    underlayColor={colors.underlay}
  >
    <Icon
      color={colors.icon}
      name='cogs'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default SettingsButton;
