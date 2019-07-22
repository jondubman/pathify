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

    // yBase is at the bottom of the timeline. y should decrease from there. Notice this function is recursive.
    const yTop = (kind: TimespanKind): number => {
      switch (kind) {
        case TimespanKind.APP_STATE:
          return yBase - height(kind); // at the bottom
        case TimespanKind.LOCATIONS:
          return yTop(TimespanKind.TRACKING) - height(kind); // above TRACKING
        case TimespanKind.MODE:
          break;
        case TimespanKind.MOTION:
          break;
        case TimespanKind.OTHER:
          return yTop(TimespanKind.LOCATIONS) - height(kind); // above LOCATIONS
        case TimespanKind.SELECTION:
          return yBase - height(kind);
        case TimespanKind.TICKS:
          break;
        case TimespanKind.TRACKING:
          return yTop(TimespanKind.APP_STATE) - height(kind); // above APP_STATE
        default:
          break;
      }
      return 0;
    }

    const height = (kind: TimespanKind): number => {
      switch (kind) {
        case TimespanKind.APP_STATE:
          return constants.timeline.miniBarHeight;
        case TimespanKind.LOCATIONS:
          return constants.timeline.miniBarHeight;
        case TimespanKind.MODE:
          break;
        case TimespanKind.MOTION:
          break;
        case TimespanKind.OTHER:
          return constants.timeline.barHeight;
        case TimespanKind.SELECTION:
          return timeline.default.height;
        case TimespanKind.TICKS:
          break;
        case TimespanKind.TRACKING:
          return constants.timeline.miniBarHeight;
        default:
          break;
      }
      return 0;
    }

    return data.map((ts: Timespan, index: number) => (
      <Rect
        key={`Rect${index}`}
        style={{ fill: ts.color ? ts.color : constants.colors.timeline.timespans[ts.kind] }}
        x={scale.x(ts.tr[0])}
        y={yTop(ts.kind)}
        width={scale.x(ts.tr[1]) - scale.x(ts.tr[0])}
        height={height(ts.kind)}
      />
    ))
  }
}

export default TimelineSpans;
