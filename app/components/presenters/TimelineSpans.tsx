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

  // TODO have scale here, need to apply it and pass in scaled X as prop to TimelineSpan, and not pass scale as a prop.
  // Then, turn TimelineSpan into a PureComponent. No biggie if this component is updated; it's TimelineSpan we want
  // to minimize updating.
  render() {
    const { data } = this.props;
    const { scale } = this.props as any;
    return data.map((ts: Timespan, index: number) => (
      <TimelineSpan key={`${scale.x(ts.tr[0])}-${scale.x(ts.tr[1])}`}
                    color={ts.color}
                    kind={ts.kind}
                    xStart={scale.x(ts.tr[0])}
                    xEnd={scale.x(ts.tr[1])}
      />
    ))
  }
}

export default TimelineSpans;
