import * as React from 'react';

import * as Victory from 'victory-native';

import constants, { TimespanKind } from 'lib/constants';
import { Timespan, Timespans } from 'containers/TimelineContainer';
import TimelineSpan from 'presenters/TimelineSpan';

interface TimelineSpansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  data: Timespans;
}

class TimelineSpans extends React.Component<TimelineSpansProps> {

  constructor(props: any) {
    super(props);
  }

  public shouldComponentUpdate(nextProps: TimelineSpansProps, nextState: any) {
    return (JSON.stringify(this.props) !== JSON.stringify(nextProps)); // TODO upgrade quick & dirty approach
  }

  public render() {
    const data = this.props.data;
    const { scale } = this.props as any;
    const { timeline } = constants;
    const yBase = timeline.default.height - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars;

    // yBase is at the bottom of the timeline. y should decrease from there. Notice this function is recursive.
    const yTop = (kind: TimespanKind): number => {
      switch (kind) {
        case TimespanKind.ACTIVITY:
          return Math.round(yBase / 2) - height(kind) / 2;
        case TimespanKind.APP_STATE:
          return 0; // APP_STATE at the top
        case TimespanKind.LOCATIONS:
          return yBase - height(kind); // LOCATIONS at the bottom
        case TimespanKind.MODE:
          break;
        case TimespanKind.MOTION:
          break;
        case TimespanKind.OTHER:
          return yTop(TimespanKind.LOCATIONS) - height(kind); // OTHER above LOCATIONS
        case TimespanKind.SELECTION:
          return yBase - height(kind); // top to bottom
        default:
          break;
      }
      return 0;
    }

    const height = (kind: TimespanKind): number => {
      switch (kind) {
        case TimespanKind.ACTIVITY:
          return constants.timeline.barHeight;
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
        default:
          break;
      }
      return 0;
    }

    return data.map((ts: Timespan, index: number) => (
      <TimelineSpan key={`${ts.tr[0]}-${ts.tr[1]}`} scale={scale} ts={ts} />
    ))
  }
}

export default TimelineSpans;
