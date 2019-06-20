import * as React from 'react';

import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants, { TimespanKind } from 'lib/constants';
import { Timespan, Timespans } from 'containers/TimelineContainer';

interface TimelineSpansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  data: Timespans;
}

class TimelineSpans extends React.Component<TimelineSpansProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const data = this.props.data;
    const {
      scale,
    } = this.props as any;

    const { timeline } = constants;

    // TODO for now, all Timespans appear at the same height
    const y = (timeline.default.height - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars)
            - timeline.barHeight;

    return data.map((ts: Timespan, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: constants.colors.timeline.timespans[ts.kind] }}
        x={scale.x(ts.tr[0])}
        y={y - timeline.barHeight * (ts.kind == TimespanKind.locations ? 0 : 1)}
        width={scale.x(ts.tr[1]) - scale.x(ts.tr[0])}
        height={constants.timeline.barHeight}
      />
    ))
  }
}

/*
        y={
          (timeline.initialHeight - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars) -
          (timeline.barHeight * (index + 1))
        }
*/

export default TimelineSpans;
