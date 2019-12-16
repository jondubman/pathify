import { connect } from 'react-redux';

import { cachedActivity } from 'lib/selectors';
import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import { ActivityDataExtended } from 'shared/activities';

interface PathsStateProps {
  activities: ActivityDataExtended[];
  currentActivityId?: string;
  selectedActivityId?: string;
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  const activities: ActivityDataExtended[] = [];
  if (state.flags.showPathsOnMap) {
    if (currentActivityId) {
      const activity = cachedActivity(state, currentActivityId);
      if (activity) {
        activities.push(activity);
      }
    }
    if (selectedActivityId && selectedActivityId !== currentActivityId) {
      const activity = cachedActivity(state, selectedActivityId);
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
