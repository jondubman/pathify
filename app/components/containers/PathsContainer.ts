import { connect } from 'react-redux';

import { currentActivity, selectedActivity } from 'lib/selectors';
import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import { Activities } from 'shared/activities';

interface PathsStateProps {
  activities: Activities;
  currentActivityId?: string;
  selectedActivityId?: string;
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  const activities: Activities = [];
  if (state.flags.showPathsOnMap) {
      const activity = currentActivity(state);
      if (activity) {
        activities.push(activity);
      }
    if (selectedActivityId) {
      const activity = selectedActivity(state);
      if (activity) {
        activities.push(activity);
      }
    }
  }
  return {
    activities,
    currentActivityId,
    selectedActivityId,
  }
}

const mapDispatchToProps = (dispatch: Function): PathsDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const PathsContainer = connect<PathsStateProps, PathsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Paths as any);

export default PathsContainer;
