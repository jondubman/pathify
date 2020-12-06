import * as React from 'react';
import * as Victory from 'victory-native';

import { TimelineFutureSpanProps } from 'containers/TimelineFutureSpanContainer';
import constants, {
  TimespanKind,
} from 'lib/constants';
import utils from 'lib/utils';
import TimelineSpan from 'presenters/TimelineSpan';
import { interval } from 'lib/timeseries';

interface TimelineFutureSpanExtendedProps extends TimelineFutureSpanProps,
  Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  // includes scale prop used below
}

class TimelineSpans extends React.Component<TimelineFutureSpanExtendedProps> {

  constructor(props: any) {
    super(props);
  }

  render() {
    if (!this.props.visible) {
      return null; // bail out
    }
    utils.addToCount('renderTimelineFutureSpan');
    const { nowTime, scale } = this.props as any;
    const endTime = nowTime + interval.days(365); // You can't scroll too far into the future, so a year is plenty.
    return (
      <TimelineSpan
        key={'FUTURE'}
        color={constants.colors.timeline.timespans[TimespanKind.FUTURE]}
        kind={TimespanKind.FUTURE}
        xStart={scale.x(nowTime)}
        xEnd={scale.x(endTime)}
      />
    )
  }
}

export default TimelineSpans;
