import { connect } from 'react-redux';

import {
  timepointVisibleOnTimeline,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityTimespans from 'presenters/ActivityTimespans';
import {
  ActivityDataExtended,
} from 'shared/activities';

export interface ActivityTimespansStateProps {
  activities: ActivityDataExtended[];
  currentActivityId: string;
  selectedActivityId: string;
}

export interface ActivityTimespansDispatchProps {
}

export type ActivityTimespansProps = ActivityTimespansStateProps & ActivityTimespansDispatchProps;

const mapStateToProps = (state: AppState): ActivityTimespansStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  const filteredActivities = state.cache.activities.filter((activity: ActivityDataExtended) => (
    timepointVisibleOnTimeline(state, activity.tStart) ||
    timepointVisibleOnTimeline(state, activity.tLast)
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
