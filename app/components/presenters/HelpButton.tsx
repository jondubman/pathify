import React, {
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import constants from 'lib/constants';
const colors = constants.colors.helpButton;
const { opacity, size } = constants.helpButton;

const Styles = StyleSheet.create({
  button: {
    // position, shape (circular) and size
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    right: 2,
    top: 2,
    justifyContent: 'center',
    flexDirection: 'row',

    // appearance
    opacity,
  },
})

interface HelpButtonProps {
  onPress: (event: GestureResponderEvent) => void;
}

const HelpButton = (props: HelpButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: colors.background,
    }]}
    onPress={props.onPress as any}
    underlayColor={colors.underlay}
  >
    <Icon
      color={colors.icon}
      name='question'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default HelpButton;
