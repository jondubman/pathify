import * as React from 'react';
import * as Victory from 'victory-native';

import { ActivityTimespansProps } from 'containers/ActivityTimespansContainer';
import constants, {
  TimespanKind,
} from 'lib/constants';
import {
  activityColorForIndex,
  activityListIndex,
} from 'lib/selectors';
import utils from 'lib/utils';
import TimelineSpan from 'presenters/TimelineSpan';
import { ActivityDataExtended } from 'lib/activities';

interface ActivityTimespansExtendedProps extends ActivityTimespansProps,
  Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  // includes scale prop used below
}

class ActivityTimespans extends React.Component<ActivityTimespansExtendedProps> {

  constructor(props: any) {
    super(props);
    this.timespanColor = this.timespanColor.bind(this);
  }

  timespanColor(activity: ActivityDataExtended, listIndex: number | undefined) {
    if (activity.id === this.props.currentActivityId) {
      return constants.colors.timeline.currentActivity;
    }
    const {
      colorizeActivites,
      timelineSpanColorOpacity,
    } = this.props;
    if (!colorizeActivites && activity.id === this.props.selectedActivityId) {
      return constants.colors.timeline.selectedActivity;
    }
    const brightness = 2; // 1 for no change, or anything <1, or anything >1
    return (!colorizeActivites || listIndex === undefined) ?
      constants.colors.timeline.timespans[TimespanKind.ACTIVITY] // default
      :
      activityColorForIndex(listIndex, timelineSpanColorOpacity);
  }

  render() {
    utils.addToCount('renderActivityTimespans');
    const { allActivities, visibleActivities } = this.props;
    const { scale } = this.props as any;
    return visibleActivities.map((activity: ActivityDataExtended, index: number) => (
      <TimelineSpan
        key={`${scale.x(activity.tStart)}-${scale.x(activity.tLast)}-${index}`}
        color={this.timespanColor(activity, activityListIndex(allActivities, activity.id))}
        kind={TimespanKind.ACTIVITY}
        xStart={scale.x(activity.tStart)}
        xEnd={scale.x(activity.tLast)}
      />
    ))
  }
}

export default ActivityTimespans;
