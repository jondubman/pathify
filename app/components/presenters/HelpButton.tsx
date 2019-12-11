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
const {
  opacity,
  rightOffset,
  size
} = constants.helpButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    paddingLeft: 1,
    paddingTop: size / 4 - 2,
    position: 'absolute',
    right: rightOffset,
    opacity,
    width: size,
  },
})

const HelpButton = (props: HelpButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.enabled ? colors.underlay : colors.background,
      top: props.topOffset,
    }]}
    onPress={props.onPress}
    underlayColor={props.enabled ? colors.background : colors.underlay}
  >
    <FontAwesome5
      color={colors.icon}
      name='lightbulb' // was previously 'question'
      size={size / 2}
    />
  </TouchableHighlight>
)

export default React.memo(HelpButton);
