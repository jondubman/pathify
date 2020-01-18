import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { FollowButtonsProps } from 'containers/FollowButtonsContainer';
import constants from 'lib/constants';

const colors = constants.colors.followButtons;
const {
  rightOffset,
  opacity,
  size,
} = constants.followButtons;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    opacity,
    paddingTop: size / 4,
    position: 'absolute',
    right: rightOffset,
    width: size,
  },
})

const FollowButtons = (props: FollowButtonsProps) => (props.hidden ? null : (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.active ? colors.background.active : colors.background.inactive,
      bottom: props.bottomOffset,
    }]}
    onPress={props.onPress}
    underlayColor={colors.underlay}
  >
    <FontAwesome5
      color={props.active ? colors.icon.active : colors.icon.inactive}
      name='location-arrow'
      size={constants.followButtons.size / 2}
    />
  </TouchableHighlight>
))

export default React.memo(FollowButtons);
