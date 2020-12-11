import { connect } from 'react-redux';

import {
  ActivityDataExtended,
} from 'lib/activities';
import database from 'lib/database';
import {
  activityIndex,
  listedActivities,
  nextActivity,
  previousActivity,
  selectedActivityIndex,
  selectedActivityPath,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import { Path } from 'lib/paths';
import Paths from 'presenters/Paths';

interface PathsStateProps {
  allActivities: ActivityDataExtended[];
  colorizeActivities: boolean;
  currentActivityId: string | null;
  pathColorOpacity: number;
  paths: Path[]; // These will be rendered from back to front.
  selectedActivityId: string | null;
  sequentialPathStartIndex: number;
}

interface PathsDispatchProps {
}

export type PathsProps = PathsStateProps & PathsDispatchProps;

const mapStateToProps = (state: AppState): PathsStateProps => {
  const { currentActivityId, scrollTime, selectedActivityId } = state.options;

  // TODO reselector
  const paths: Path[] = [];
  let sequentialPathStartIndex = -1;
  if (state.flags.showPathsOnMap) {
    if (state.flags.showSequentialPaths) {
      const activities = listedActivities(state);
      let index = selectedActivityIndex(state);
      if (index === undefined) {
        const prev = previousActivity(state, scrollTime);
        if (prev) {
          index = activityIndex(state, prev.id);
        }
        if (index === undefined) { // maybe before first activity?
          const next = nextActivity(state, scrollTime);
          if (next) {
            index = activityIndex(state, next.id);
          }
        }
      }
      if (index !== undefined) {
        sequentialPathStartIndex = index;
        const numPrevious = Math.floor(state.options.maxDisplayPaths / 2) - 1;
        const numSubsequent = numPrevious;
        for (let i = index - numPrevious; i < index + numSubsequent; i++) {
          if (i < 0 || i >= activities.length) {
            continue; // out of bounds
          }
          const activity = activities[i];
          if (activity && activity.tEnd) { // tEnd check skips currentActivity, which is handled separately below
            const path = database.pathById(activity.id);
            if (path) {
              paths.push(path);
            }
          }
        }
      }
    } else { // don't showSequentialPaths
      if (state.flags.filterActivityList) { // TODO dev feature only for now
        for (const activity of listedActivities(state)) {
          const { id } = activity;
          if (id !== currentActivityId && id !== selectedActivityId) {
            const path = database.pathById(id);
            if (path) {
              paths.push(path);
              if (paths.length >= state.options.maxDisplayPaths) {
                break; // TODO
              }
            }
          }
        }
      }
    }

    // TODO this memoized selector appears to be causing dropped renders due to race condition or stale Path
    // just after executing stopActivity, so avoiding use of that selector for now. Investigate.
    // const selectedPath = selectedActivityPath(state);
    // if (selectedPath) {
    //   paths.push(selectedPath);
    // }
    if (selectedActivityId && selectedActivityId !== currentActivityId) {
      const selectedPath = database.pathById(selectedActivityId);
      if (selectedPath) {
        paths.push(selectedPath);
      }
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
    pathColorOpacity: state.options.pathColorOpacity,
    paths,
    selectedActivityId,
    sequentialPathStartIndex,
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
