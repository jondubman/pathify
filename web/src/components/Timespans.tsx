import Radium from 'radium';
import * as React from 'react';

import * as Victory from 'victory';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

interface TimespansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
}

class Timespans extends React.Component<TimespansProps> {
  constructor(props: any) {
    super(props);
  }
  public render() {
    const {
      data,
      scale,
    } = this.props as any;

    const scaleUsed = scale.x;
    return data.map((d: any, index: number) => (
      <Rect
        style={{ fill: index ? 'red' : 'blue' }}
        x={scaleUsed(d.t1)}
        y={150 + 100 * index}
        width={scaleUsed(d.t2) - scaleUsed(d.t1)}
        height={50}
      />
    ))
  }
}

export default Radium(Timespans);
