// This TimelineSpans presentational component contains the TimelineSpan presentational component.
// There is also the TimelineSpansContainer that provides data for this component.

import * as React from 'react';
import * as Victory from 'victory-native';

import { TimelineSpansProps } from 'containers/TimelineSpansContainer';
import constants, {
  TimespanKind,
} from 'lib/constants';
import utils from 'lib/utils';
import TimelineSpan from 'presenters/TimelineSpan';
import { ActivityDataExtended } from 'shared/activities';

interface TimelineSpansExtendedProps extends TimelineSpansProps,
  Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  // includes scale prop used below
}

class TimelineSpans extends React.Component<TimelineSpansExtendedProps> {

  constructor(props: any) {
    super(props);
    this.timespanColor = this.timespanColor.bind(this);
  }

  timespanColor(activity: ActivityDataExtended) {
    if (activity.id === this.props.currentActivityId) {
      return constants.colors.timeline.currentActivity;
    }
    if (activity.id === this.props.selectedActivityId) {
      return constants.colors.timeline.selectedActivity;
    }
    return constants.colors.timeline.timespans[TimespanKind.ACTIVITY]; // default
  }

  render() {
    utils.addToCount('renderTimelineSpans');
    const { activities } = this.props;
    const { scale } = this.props as any;
    return activities.map((activity: ActivityDataExtended, index: number) => (
      <TimelineSpan
        key={`${scale.x(activity.tStart)}-${scale.x(activity.tLast)}`}
        color={this.timespanColor(activity)}
        kind={TimespanKind.ACTIVITY}
        xStart={scale.x(activity.tStart)}
        xEnd={scale.x(activity.tLast)}
      />
    ))
  }
}

export default TimelineSpans;
