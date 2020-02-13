import * as React from 'react';

import {
  View,
} from 'react-native';

import { TipProps } from 'containers/LabelContainer';
import constants from 'lib/constants';

export const tipTextStyle = {
  color: constants.colorThemes.tips,
  fontFamily: constants.tips.fontFamily,
  fontSize: constants.tips.fontSize,
  fontWeight: constants.tips.fontWeight,
}

class Tip extends React.Component<TipProps> {

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

export default Tip;
