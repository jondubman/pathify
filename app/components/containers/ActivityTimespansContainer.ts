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
  allActivities: ActivityDataExtended[];
  colorizeActivites: boolean;
  currentActivityId: string;
  selectedActivityId: string;
  timelineSpanColorOpacity: number;
  visibleActivities: ActivityDataExtended[];
}

export interface ActivityTimespansDispatchProps {
}

export type ActivityTimespansProps = ActivityTimespansStateProps & ActivityTimespansDispatchProps;

const mapStateToProps = (state: AppState): ActivityTimespansStateProps => {
  const {
    currentActivityId,
    scrollTime,
    selectedActivityId,
    timelineSpanColorOpacity,
  } = state.options;
  const allActivities = state.cache.activities;
  // Filter out any ActivityTimespans that are completely out of visible range on the timeline, as an optimization.
  const visibleActivities = allActivities.filter((activity: ActivityDataExtended) => (
    timepointVisibleOnTimeline(state, activity.tStart) || // can see activity start
    timepointVisibleOnTimeline(state, activity.tLast) || // or can see activity end
    (activity.tStart < scrollTime && activity.tLast > scrollTime) // or activity spans scrollTime
  ))
  return {
    allActivities,
    colorizeActivites: state.flags.colorizeActivities,
    currentActivityId: currentActivityId || '',
    selectedActivityId: selectedActivityId || '',
    timelineSpanColorOpacity,
    visibleActivities,
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
