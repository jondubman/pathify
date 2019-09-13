import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import constants from 'lib/constants';
import { SettingsButtonProps } from 'containers/SettingsButtonContainer';

const colors = constants.colors.settingsButton;
const {
  leftOffset,
  opacityWhenClosed,
  opacityWhenOpen,
  size,
  topOffset
} = constants.settingsButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    left: leftOffset,
    paddingTop: size / 4,
    position: 'absolute',
    top: topOffset,
    width: size,
  },
})

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

export default React.memo(SettingsButton);
