import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
import { HelpButtonProps } from 'containers/HelpButtonContainer';
import LabelContainer from 'containers/LabelContainer';
import { labelTextStyle } from 'presenters/Label';

const colors = constants.colors.helpButton;
const {
  opacityWhenClosed,
  opacityWhenOpen,
  rightOffset,
  size,
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
    width: size,
  },
  labelView: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    right: constants.buttonOffset,
    width: constants.buttonSize,
  },
})

const HelpButton = (props: HelpButtonProps) => (
  <Fragment>
    <View style={[Styles.labelView, { top: props.topOffset + constants.buttonSize - 1 }]}>
      <LabelContainer>
        <Text style={labelTextStyle}>
          INFO
        </Text>
      </LabelContainer>
    </View>
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.enabled ? colors.underlay : colors.background,
        opacity: props.open ? opacityWhenOpen : opacityWhenClosed,
        top: props.topOffset,
      }]}
      onPressIn={props.onPress}
      underlayColor={props.enabled ? colors.background : colors.underlay}
    >
      <FontAwesome5
        color={colors.icon}
        name='lightbulb' // was previously 'question'
        size={size / 2}
      />
    </TouchableHighlight>
  </Fragment>
)

export default React.memo(HelpButton);
