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
  topOffset
} = constants.settingsButton;

const Styles = StyleSheet.create({
  button: {
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    left: leftOffset,
    paddingTop: size / 4 - 2,
    position: 'absolute',
    top: topOffset,
    width: size,
  },
  labelView: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    width: constants.buttonSize + (constants.buttonOffset * 2) + 2,
  },
})

const SettingsButton = (props: SettingsButtonProps) => (
  <Fragment>
    {props.open ? null : (
      <View style={[Styles.labelView, { top: props.topOffset + constants.buttonSize - 1 }]}>
        <LabelContainer>
          <Text style={labelTextStyle}>
            SETTINGS
          </Text>
        </LabelContainer>
      </View>
    )}
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.open ? colors.underlay : colors.background,
        opacity: props.open ? opacityWhenOpen : opacityWhenClosed,
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
