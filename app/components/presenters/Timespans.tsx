import * as React from 'react';

import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants from 'lib/constants';
import log from 'lib/log';
import { TimeRange } from 'shared/timeseries';

interface TimespansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
}

class Timespans extends React.Component<TimespansProps> {

  // public renderCount: number = 0;

  constructor(props: any) {
    super(props);
  }

  public render() {
    const data = this.props.data as TimeRange[];
    const {
      scale,
    } = this.props as any;

    const { timeline } = constants;
    return data.map((tr: TimeRange, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: constants.colors.timeline.bars[index] }}
        x={scale.x(tr[0])}
        y={
          (timeline.initialHeight - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars) -
          (timeline.barHeight * (index + 1))
        }
        width={scale.x(tr[1]) - scale.x(tr[0])}
        height={constants.timeline.barHeight}
      />
    ))
  }
}

export default Timespans;
