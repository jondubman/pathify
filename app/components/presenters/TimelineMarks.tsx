import * as React from 'react';
import * as Victory from 'victory-native';

import TimelineMark from 'presenters/TimelineMark';
import constants from 'lib/constants';
import {
  MarkEvent,
  MarkEvents,
  MarkType
} from 'shared/marks';
import { activityIncludesMark } from 'lib/selectors';
import { Timepoint } from 'shared/timeseries';

interface TimelineMarksProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  currentActivityId: string;
  data: MarkEvents;
  selectedActivityId: string;
}

class TimelineMarks extends React.Component<TimelineMarksProps> {

  constructor(props: any) {
    super(props);
  }

  public shouldComponentUpdate(nextProps: TimelineMarksProps, nextState: any) {
    return (JSON.stringify(this.props) !== JSON.stringify(nextProps)); // TODO upgrade quick & dirty approach
  }

  public render() {
    const {
      currentActivityId,
      data,
      selectedActivityId,
    } = this.props;
    const {
      scale, // as in d3 scale
    } = this.props as any;

    return data.map((mark: MarkEvent, index: number) => (
      <TimelineMark
        currentActivityId={currentActivityId}
        index={index}
        mark={mark}
        scale={scale}
        selectedActivityId={selectedActivityId}
      />
    ))
  }
}

export default TimelineMarks;
