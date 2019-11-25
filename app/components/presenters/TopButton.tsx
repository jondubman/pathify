import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import { TopButtonProps } from 'containers/TopButtonContainer';

const colors = constants.colors.topButton;
const {
  opacity,
  size,
} = constants.topButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    left: centerline() - constants.buttonSize / 2,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

const TopButton = (props: TopButtonProps) => (props.visible ? (
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
      name='bars'
      size={size / 2}
    />
  </TouchableHighlight>
) : null)

export default React.memo(TopButton);
