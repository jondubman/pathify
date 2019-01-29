import React, {
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import constants from 'lib/constants';
import { dynamicTimelineHeight } from 'lib/selectors';
const colors = constants.colors.followMeButton;
const {
  bottomOffset,
  rightOffset,
  opacity,
  size
} = constants.followMeButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    right: rightOffset,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
})

interface FollowMeButtonProps {
  active: boolean;
  marginBottom: number,
  onPress: (event: GestureResponderEvent) => void;
}

const FollowMeButton = (props: FollowMeButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.active ? colors.background.active : colors.background.inactive,
      bottom: bottomOffset + props.marginBottom,
    }]}
    onPress={props.onPress}
    underlayColor={colors.underlay}
  >
    <Icon
      color={props.active ? colors.icon.active : colors.icon.inactive}
      name='location-arrow'
      size={constants.followMeButton.size / 2}
    />
  </TouchableHighlight>
)

export default FollowMeButton;
