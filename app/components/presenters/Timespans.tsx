import * as React from 'react';

import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import log from 'lib/log';
import constants from 'lib/constants';

interface TimespansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
}

class Timespans extends React.Component<TimespansProps> {

  public renderCount: number = 0;

  constructor(props: any) {
    super(props);
  }

  public render() {
    const {
      data,
      scale,
    } = this.props as any;

    const scaleUsed = scale.x;
    const tl = constants.timeline;

    return data.map((d: any, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: constants.colors.timeline.bars[index] }}
        x={scaleUsed(d.t1)}
        y={
          (tl.height - tl.bottomPaddingForAxis - tl.bottomPaddingForBars) -
          (tl.barHeight * (index + 1))
        }
        width={scaleUsed(d.t2) - scaleUsed(d.t1)}
        height={constants.timeline.barHeight}
      />
    ))
  }
}

export default Timespans;
