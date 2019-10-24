import React, {
  PureComponent,
} from 'react';

import {
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { DebugInfoProps } from 'containers/DebugInfoContainer';
import constants from 'lib/constants';

const colors = constants.colors.debugInfo;

const textStyle: TextStyle = {
  color: colors.text,
  fontSize: 16,
}

class DebugInfo extends PureComponent<DebugInfoProps> {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      borderWidth,
      height,
      padding,
      width,
    } = constants.debugInfo;

    const {
      backgroundColor,
      borderColor,
    } = constants.colors.debugInfo;

    const viewStyle: ViewStyle = {
      alignSelf: 'center',
      backgroundColor,
      borderColor,
      borderWidth,
      height,
      padding,
      position: 'absolute',
      top: this.props.dynamicAreaTop,
      width,
    }
    return (
      <View style={viewStyle}>
        <Text style={textStyle}>
          {this.props.text}
        </Text>
      </View>
    )
  }
}

export default DebugInfo;
