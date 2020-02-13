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
import { labelTextStyle } from 'presenters/Label';

const colors = constants.colors.compassButton;
const {
  leftOffset,
  opacity,
  size
} = constants.compassButton;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    left: leftOffset,
    paddingTop: size / 4,
    position: 'absolute',
    opacity,
    width: size,
  },
})

import { CompassButtonProps } from 'containers/CompassButtonContainer';
const bottom1 = constants.buttonBaseOffsetPerRow - constants.bottomButtonSpacing;

const CompassButton = (props: CompassButtonProps) => (props.hidden ? null : (
  props.heading && props.heading > constants.compassButton.mapHeadingThreshold ?
    (
    <Fragment>
        <View style={{ bottom: props.bottomOffset + bottom1, left: 1 }}>
          <LabelContainer>
            <Text style={labelTextStyle}>
              REORIENT
            </Text>
          </LabelContainer>
      </View>
      <TouchableHighlight
        style={[Styles.button, {
          backgroundColor: props.reorienting ? colors.underlay : colors.background,
          bottom: props.bottomOffset + constants.buttonBaseOffsetPerRow,
        }]}
        onPress={props.onPress}
        underlayColor={colors.underlay}
      >
        <FontAwesome5
          color={colors.icon}
          name='compass'
          size={constants.compassButton.size / 2}
        />
      </TouchableHighlight>
    </Fragment>
    ) : null
))

export default React.memo(CompassButton);
