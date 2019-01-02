import React, {
  Component,
} from 'react';

import {
  ART,
  View,
} from 'react-native';

import Svg, { Circle, Rect } from 'react-native-svg'

interface Props extends React.Props<any> {
}

class Timeline extends Component<Props> {
  render() {
    return (
      <View style={{ margin: 5 }}>
        <ART.Surface width={200} height={20}>
          <ART.Group>
            <ART.Text
              alignment="left"
              font={`14px "Helvetica Neue", "Helvetica", Arial`}
              fill="blue"
            >
              Hello, ART world!
            </ART.Text>
          </ART.Group>
        </ART.Surface>

        <Svg height='100' width='100'>
          <Circle
            cx='50'
            cy='50'
            r='45'
            stroke='blue'
            strokeWidth='2.5'
            fill='green' />
          <Rect
            x='15'
            y='15'
            width='70'
            height='70'
            stroke='red'
            strokeWidth='2'
            fill='yellow' />
        </Svg>
      </View>
    )
  }
}

export default Timeline;
