import * as React from 'react';

import {
  View,
} from 'react-native';

import { LabelProps } from 'containers/LabelContainer';
import constants from 'lib/constants';

export const labelTextStyle = {
  color: constants.colorThemes.labels,
  fontFamily: constants.labels.fontFamily,
  fontSize: constants.labels.fontSize,
  fontWeight: constants.labels.fontWeight,
}

const hideStyle = { opacity: 0 };
const showStyle = { opacity: 1 };

class Label extends React.Component<LabelProps> {

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <View pointerEvents="none" style={this.props.visible ? showStyle : hideStyle}>
        {this.props.children}
      </View>
    )
  }
}

export default Label;
