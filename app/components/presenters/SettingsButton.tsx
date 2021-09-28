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
import { SettingsButtonProps } from 'containers/SettingsButtonContainer';
import LabelContainer from 'containers/LabelContainer';
import { labelTextStyle } from 'presenters/Label';

const colors = constants.colors.settingsButton;
const {
  leftOffset,
  opacityWhenClosed,
  opacityWhenOpen,
  size,
} = constants.settingsButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    left: leftOffset,
    paddingTop: size / 4 - 2, // adjusts icon inside circle
    position: 'absolute',
    width: size,
  },
  labelView: {
    position: 'absolute',
  },
})

const SettingsButton = (props: SettingsButtonProps) => (
  <Fragment>
    <View style={[Styles.labelView, {
        top: props.topOffset + constants.buttonSize - 1,
        left: props.open ? 8 : 1,
    }]}>
      <LabelContainer>
        <Text style={labelTextStyle}>
          SETTINGS
        </Text>
      </LabelContainer>
    </View>
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.open ? colors.backgroundOpen : colors.background,
        opacity: props.open ? opacityWhenOpen : opacityWhenClosed,
        top: props.topOffset,
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
  </Fragment>
)

export default React.memo(SettingsButton);
