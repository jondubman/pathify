import React, {
  PureComponent,
} from 'react';

import {
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import constants from 'lib/constants';
import { DebugInfoProps } from 'containers/DebugInfoContainer';

const colors = constants.colors.debugInfo;

const textStyle: TextStyle = {
  color: colors.text,
  fontSize: 12,
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
