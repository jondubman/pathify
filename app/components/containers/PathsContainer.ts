import { connect } from 'react-redux';

import {
  ActivityDataExtended,
} from 'lib/activities';
import database from 'lib/database';
import {
  listedActivities,
  selectedActivityPath
} from 'lib/selectors';
import { AppState } from 'lib/state';
import Paths from 'presenters/Paths';
import { Path } from 'lib/paths';

interface PathsStateProps {
  allActivities: ActivityDataExtended[];
  colorizeActivities: boolean;
  currentActivityId: string | null;
  paths: Path[]; // These will be rendered from back to front.
  selectedActivityId: string | null;
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;

  // TODO reselector
  const paths: Path[] = [];
  if (state.flags.showPathsOnMap) {
    if (state.flags.filterActivityList) {
      for (const activity of listedActivities(state)) {
        const { id } = activity;
        if (id !== currentActivityId && id !== selectedActivityId) {
          const path = database.pathById(id);
          if (path) {
            paths.push(path);
            if (paths.length > state.options.maxDisplayPaths) {
              break; // TODO
            }
          }
        }
      }
    }
    // using memoized selector
    const selectedPath = selectedActivityPath(state);
    if (selectedPath) {
      paths.push(selectedPath);
    }
    // currentActivity last, therefore on top:
    if (currentActivityId) {
      const path = database.pathById(currentActivityId);
      if (path) {
        paths.push(path);
      }
    }
  }
  return {
    allActivities: state.cache.activities,
    colorizeActivities: state.flags.colorizeActivities,
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
