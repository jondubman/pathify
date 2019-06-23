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

    const yBase = timeline.default.height - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars;

    const y = (kind: TimespanKind): number => {
      if (kind == TimespanKind.locations) {
        return yBase - timeline.barHeight;
      }
      if (kind == TimespanKind.other) {
        return yBase - timeline.barHeight * 2;
      }
      return 0;
    }

    const height = (kind: TimespanKind): number => {
      if (kind == TimespanKind.selection) {
        return timeline.default.height;
      }
      return constants.timeline.barHeight;
    }

    return data.map((ts: Timespan, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: constants.colors.timeline.timespans[ts.kind] }}
        x={scale.x(ts.tr[0])}
        y={y(ts.kind)}
        width={scale.x(ts.tr[1]) - scale.x(ts.tr[0])}
        height={height(ts.kind)}
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
