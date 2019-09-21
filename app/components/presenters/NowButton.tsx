import * as React from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import { NowButtonProps } from 'containers/NowButtonContainer';
import constants from 'lib/constants';

const colors = constants.colors.nowButton;

const Styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
})

const NowButton = (props: NowButtonProps) => (
  (props.hidden ? null : (
    <TouchableHighlight
      key={'nowButton'}
      style={Styles.button}
      onPress={props.onPress}
      underlayColor={colors.underlay}
    >
      <FontAwesome5
        color={colors.icon}
        name='play'
        size={constants.nowButton.iconSize}
      />
    </TouchableHighlight>
  ))
)

export default NowButton;
