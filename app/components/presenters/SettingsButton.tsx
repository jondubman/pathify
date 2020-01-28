import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

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
    paddingTop: size / 4 - 2,
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
    onPressIn={props.onPressIn}
    underlayColor={props.open ? colors.background : colors.underlay}
  >
    <FontAwesome5
      color={colors.icon}
      name='cogs'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default React.memo(SettingsButton);
