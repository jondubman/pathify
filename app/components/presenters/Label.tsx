import * as React from 'react';

import {
  View,
} from 'react-native';

import { LabelProps } from 'containers/LabelContainer';
import constants from 'lib/constants';

export const labelTextStyle = {
  color: constants.colorThemes.tips,
  fontFamily: constants.tips.fontFamily,
  fontSize: constants.tips.fontSize,
  fontWeight: constants.tips.fontWeight,
}

class Label extends React.Component<LabelProps> {

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <View pointerEvents="none" style={{ opacity: this.props.visible ? 1 : 0}}>
        {this.props.children}
      </View>
    )
  }
}

export default Label;
