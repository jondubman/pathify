import React, {
  Component,
} from 'react';

import {
  ART,
  View,
} from 'react-native';

import { VictoryBar, VictoryChart, VictoryTheme } from 'victory-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import constants from 'lib/constants';

interface Props extends React.Props<any> {
}

class Timeline extends Component<Props> {

  public shouldComponentUpdate() {
    return false; // Tell React not to re-render this component
  }

  public render() {
    // return (
    //   <View style={{ margin: 5 }}>
    //     <ART.Surface width={200} height={20}>
    //       <ART.Group>
    //         <ART.Text
    //           alignment="left"
    //           font={`14px "Helvetica Neue", "Helvetica", Arial`}
    //           fill="blue"
    //         >
    //           Hello, ART world!
    //         </ART.Text>
    //       </ART.Group>
    //     </ART.Surface>

    //     <Svg height='100' width='100'>
    //       <Circle
    //         cx='50'
    //         cy='50'
    //         r='45'
    //         stroke='blue'
    //         strokeWidth='2.5'
    //         fill='green' />
    //       <Rect
    //         x='15'
    //         y='15'
    //         width='70'
    //         height='70'
    //         stroke='red'
    //         strokeWidth='2'
    //         fill='yellow' />
    //     </Svg>
    //   </View>
    // )

    const data = [
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: 3, y: 5 },
    ]

    // return (
    //   <View style={{ margin: 5 }}>
    //   </View>
    // )

    return (
      <View style={{ margin: 5 }}>
        <VictoryChart
          domainPadding={10}
          height={constants.timelineHeight}
        >
          <VictoryBar horizontal data={data} style={{ data: { fill: "#c43a31" } }} />
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
