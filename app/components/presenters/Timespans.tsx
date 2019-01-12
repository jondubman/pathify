import * as React from 'react';

import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import log from 'lib/log';

// interface TimespansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
// }

class Timespans extends React.Component<any> {

  public renderCount: number = 0;

  constructor(props: any) {
    super(props);
  }

  public render() {
    this.renderCount++;
    if (this.renderCount % 10 == 0) {
      log.debug('  Timespans', this.renderCount);
    }

    const {
      data,
      scale,
    } = this.props as any;

    const scaleUsed = scale.x;
    return data.map((d: any, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: index % 2 ? 'red' : 'blue' }}
        x={scaleUsed(d.t1)}
        y={2 * index}
        width={scaleUsed(d.t2) - scaleUsed(d.t1)}
        height={1}
      />
    ))
  }
}

export default Timespans;
