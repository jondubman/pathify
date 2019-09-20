import * as React from 'react';

import * as Victory from 'victory-native';

import { Timespan, Timespans } from 'containers/TimelineContainer';
import TimelineSpan from 'presenters/TimelineSpan';

interface TimelineSpansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  data: Timespans;
}

class TimelineSpans extends React.Component<TimelineSpansProps> {

  constructor(props: any) {
    super(props);
  }

  // public shouldComponentUpdate(nextProps: TimelineSpansProps, nextState: any) {
  //   return (JSON.stringify(this.props) !== JSON.stringify(nextProps)); // TODO upgrade quick & dirty approach
  // }

  public render() {
    const data = this.props.data;
    const { scale } = this.props as any;
    return data.map((ts: Timespan, index: number) => (
      <TimelineSpan key={`${ts.tr[0]}-${ts.tr[1]}`} scale={scale} ts={ts} />
    ))
  }
}

export default TimelineSpans;
