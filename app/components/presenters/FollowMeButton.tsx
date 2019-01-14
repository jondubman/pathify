import React, {
} from 'react';

import {
  GestureResponderEvent,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

import constants from 'lib/constants';
const colors = constants.colors.followMeButton;

const Styles = StyleSheet.create({
  button: {
    // position, shape (circular) and size
    borderRadius: 25,
    position: 'absolute',
    paddingTop: constants.followMeButton.size / 4,
    width: constants.followMeButton.size,
    height: constants.followMeButton.size,
    bottom: 35,
    right: 2,
    justifyContent: 'center',
    flexDirection: 'row',

    // appearance
    opacity: constants.followMeButton.opacity,
  },
})

interface FollowMeButtonProps {
  active: boolean;
  onPress: (event: GestureResponderEvent) => void;
}

const FollowMeButton = (props: FollowMeButtonProps) => (
  <TouchableHighlight
    style={[Styles.button, {
      backgroundColor: props.active ? colors.background.active : colors.background.inactive,
    }]}
    onPress={props.onPress as any}
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
