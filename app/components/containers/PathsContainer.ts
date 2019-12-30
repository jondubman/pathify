import { connect } from 'react-redux';

import database from 'lib/database';
import { cachedActivity } from 'lib/selectors';
import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import { ActivityDataExtended } from 'shared/activities';
import { Path } from 'shared/paths';

interface PathsStateProps {
  currentActivityId?: string;
  paths: Path[];
  selectedActivityId?: string;
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  const paths: Path[] = [];
  if (state.flags.showPathsOnMap) {
    if (currentActivityId) {
      const path = database.pathById(currentActivityId);
      if (path) {
        paths.push(path);
      }
    }
    if (selectedActivityId && selectedActivityId !== currentActivityId) {
      const path = database.pathById(selectedActivityId);
      if (path) {
        paths.push(path);
      }
    }
  }
  return {
    currentActivityId,
    paths,
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
