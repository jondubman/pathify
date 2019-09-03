import { connect } from 'react-redux';

import database from 'lib/database';
import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import locations, { Path, PathType } from 'shared/locations';

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
    paths.push({ ...locations.pathFromEvents(database.events(), currentActivity.tr), type: PathType.CURRENT });
  }
  if (selectedActivity) {
    paths.push({ ...locations.pathFromEvents(database.events(), selectedActivity.tr), type: PathType.DEFAULT });
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
