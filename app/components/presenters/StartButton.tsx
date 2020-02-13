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

import LabelContainer from 'containers/LabelContainer';
import constants from 'lib/constants';
import { tipTextStyle } from 'presenters/Label';

const colors = constants.colors.startButton;
const {
  leftOffset,
  opacity,
  size,
} = constants.startButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    paddingTop: size / 4,
    position: 'absolute',
    opacity,
    width: size,
  },
  label: {
    color: constants.colors.byName.black,
    fontFamily: constants.fonts.family,
    fontSize: 16,
    paddingTop: 2,
  },
  tipView: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    position: 'absolute',
    left: 1,
    width: 100, // arbitrary
  },
})

// const modeIcons = ['ghost', 'bullseye', 'running', 'bolt']; // also 'play'

import { StartButtonProps } from 'containers/StartButtonContainer';

const StartButton = (props: StartButtonProps) => (
  <Fragment>
    <View style={[Styles.tipView, { bottom: props.bottomOffset - constants.bottomButtonSpacing }]}>
      <LabelContainer>
        <Text style={tipTextStyle}>
          TRACKING
        </Text>
      </LabelContainer>
    </View>
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.trackingActivity ? colors.enabledBackground : colors.disabledBackground,
        bottom: props.bottomOffset,
        left: leftOffset,
      }]}
      onPressIn={props.onPressIn}
      underlayColor={props.trackingActivity ? colors.enabledUnderlay : colors.disabledUnderlay}
    >
      {props.trackingActivity ? (
        <FontAwesome5
          color={constants.colors.byName.black}
          name={'stop'}
          size={constants.startButton.size / 2}
        />
      ) : (
        <Text style={Styles.label}>
          {'START'}
        </Text>
      )}
    </TouchableHighlight>
  </Fragment>
)

export default StartButton;
