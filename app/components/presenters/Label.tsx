import * as React from 'react';

import {
  View,
} from 'react-native';

import { LabelProps } from 'containers/LabelContainer';
import constants from 'lib/constants';
import log from 'shared/log';

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
    const { props } = this;
    log.debug('props');
    const style = (props.alwaysShow || props.visible) ? showStyle : hideStyle;
    return (
      <View pointerEvents="none" style={style}>
        {props.children}
      </View>
    )
  }
}

export default Label;
