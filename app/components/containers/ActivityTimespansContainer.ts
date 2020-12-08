import { connect } from 'react-redux';

import {
  timepointVisibleOnTimeline,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityTimespans from 'presenters/ActivityTimespans';
import {
  ActivityDataExtended,
} from 'lib/activities';

export interface ActivityTimespansStateProps {
  activities: ActivityDataExtended[];
  currentActivityId: string;
  selectedActivityId: string;
}

export interface ActivityTimespansDispatchProps {
}

export type ActivityTimespansProps = ActivityTimespansStateProps & ActivityTimespansDispatchProps;

const mapStateToProps = (state: AppState): ActivityTimespansStateProps => {
  const {
    currentActivityId,
    scrollTime,
    selectedActivityId,
  } = state.options;
  // Filter out any ActivityTimespans that are completely out of visible range on the timeline, as an optimization.
  const filteredActivities = state.cache.activities.filter((activity: ActivityDataExtended) => (
    timepointVisibleOnTimeline(state, activity.tStart) || // can see activity start
    timepointVisibleOnTimeline(state, activity.tLast) || // or can see activity end
    (activity.tStart < scrollTime && activity.tLast > scrollTime) // or activity spans scrollTime
  ))
  return {
    activities: filteredActivities,
    currentActivityId: currentActivityId || '',
    selectedActivityId: selectedActivityId || '',
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityTimespansDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const ActivityTimespansContainer = connect<ActivityTimespansStateProps, ActivityTimespansDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityTimespans as any);

export default ActivityTimespansContainer;
