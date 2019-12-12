import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityList from 'presenters/ActivityList';
import {
  ActivityDataExtended,
} from 'shared/activities';
import log from 'shared/log';

interface ActivityListStateProps {
  list: ActivityDataExtended[];
  refreshCount: number;
  scrollTime: number;
  selectedActivityId: string;
  top: number;
}

interface ActivityListDispatchProps {
  onPressActivity: (activity: ActivityDataExtended) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  return {
    list: state.cache.activities || [],
    refreshCount: state.cache.refreshCount,
    scrollTime: state.options.scrollTime,
    selectedActivityId: state.options.selectedActivityId,
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const onPressActivity = (activity: ActivityDataExtended): void => {
    if (activity && activity.tStart) {
      log.debug('onPressActivity', activity.id);
      if (activity.tEnd) {
        // Pressing some prior activity.
        dispatch(newAction(AppAction.flagDisable, 'timelineNow'));
        const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
          (activity.tStart + (activity.tLastUpdate || activity.tStart)) / 2;
        const appOptions = {
          scrollTime: newTime,
          selectedActivityId: activity.id,
          viewTime: newTime,
        }
        log.debug('onPressActivity appOptions', appOptions);
        dispatch(newAction(AppAction.setAppOption, appOptions));
      } else {
        // Pressing the currentActivity.
        dispatch(newAction(AppAction.flagEnable, 'timelineNow'));
        dispatch(newAction(AppAction.startFollowingUser));
      }
      dispatch(newAction(AppAction.zoomToActivity, { id: activity.id }));
    }
  }
  const dispatchers = {
    onPressActivity,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
