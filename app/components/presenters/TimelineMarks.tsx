import * as React from 'react';

import { TimelineMarksProps } from 'containers/TimelineMarksContainer';
import TimelineMark from 'presenters/TimelineMark';
import {
  MarkEvent,
} from 'shared/marks';

class TimelineMarks extends React.Component<TimelineMarksProps> {

  constructor(props: any) {
    super(props);
  }

  // shouldComponentUpdate(nextProps: TimelineMarksProps, nextState: any) {
  //   return (JSON.stringify(this.props) !== JSON.stringify(nextProps)); // TODO upgrade quick & dirty approach
  // }

  render() {
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
        key={index}
        mark={mark}
        scale={scale}
        selectedActivityId={selectedActivityId}
      />
    ))
  }
}

export default TimelineMarks;
