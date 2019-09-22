import React, {
  Fragment
} from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { NowButtonProps } from 'containers/NowButtonContainer';
import constants from 'lib/constants';

const colors = constants.colors.nowButton;

const Styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background,
    position: 'absolute',
  },
  text: {
    color: colors.text,
    fontFamily: constants.fonts.family,
    fontSize: 15,
    paddingLeft: 2,
    paddingTop: 20,
  },
  view: {
    position: 'absolute',
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
      <Fragment>
        <View style={Styles.view}>
          <FontAwesome5
            color={colors.icon}
            name='play'
            size={constants.nowButton.iconSize}
          >
          </FontAwesome5 >
        </View>
        <View style={Styles.view}>
          <Text style={Styles.text}>
            {'NOW'}
          </Text>
        </View>
      </Fragment>
    </TouchableHighlight>
  ))
)

export default NowButton;
