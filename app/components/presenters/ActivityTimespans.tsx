import * as React from 'react';
import * as Victory from 'victory-native';

import { ActivityTimespansProps } from 'containers/ActivityTimespansContainer';
import constants, {
  TimespanKind,
} from 'lib/constants';
import utils from 'lib/utils';
import TimelineSpan from 'presenters/TimelineSpan';
import { ActivityDataExtended } from 'shared/activities';

interface ActivityTimespansExtendedProps extends ActivityTimespansProps,
  Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  // includes scale prop used below
}

class ActivityTimespans extends React.Component<ActivityTimespansExtendedProps> {

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
    utils.addToCount('renderActivityTimespans');
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

export default ActivityTimespans;
