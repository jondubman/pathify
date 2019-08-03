import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import locations, { Path } from 'shared/locations';

interface PathsStateProps {
  paths: Path[];
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const paths: Path[] = [];
  const { currentActivity, selectedActivity } = state.options;
  if (currentActivity) {
    paths.push(locations.pathFromEvents(state.events, currentActivity.tr));
  }
  if (selectedActivity) {
    paths.push(locations.pathFromEvents(state.events, selectedActivity.tr));
  }
  return {
    paths,
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
