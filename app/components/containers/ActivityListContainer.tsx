import React, {
  Component,
} from 'react';
import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import {
  dynamicTopBelowButtons,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import ActivityList from 'presenters/ActivityList';
import {
  ActivityDataExtended,
} from 'shared/activities';
import log from 'shared/log';

interface ActivityListStateProps {
  animated: boolean;
  list: ActivityDataExtended[];
  refreshCount: number;
  selectedActivityId: string | null;
  top: number;
}

interface ActivityListDispatchProps {
  onPressActivity: (activity: ActivityDataExtended) => void;
  onScroll: (x: number) => void;
  register: (component: Component) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  return {
    animated: state.flags.timelineScrolling,
    list: state.cache.activities || [],
    refreshCount: state.cache.refreshCount,
    selectedActivityId: state.options.selectedActivityId,
    top: dynamicTopBelowButtons(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  // TODO move most of this to selectActivity saga so it can be triggered independently
  const onPressActivity = (activity: ActivityDataExtended): void => {
    if (activity && activity.tStart) {
      log.debug('onPressActivity', activity.id);
      const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
        (activity.tStart + (activity.tLastUpdate || activity.tStart)) / 2;
      if (activity.tEnd) {
        // Pressing some prior activity.
        dispatch(newAction(AppAction.flagDisable, 'timelineNow'));
        dispatch(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in onPressActivity
      } else {
        // Pressing the currentActivity.
        dispatch(newAction(AppAction.flagEnable, 'timelineNow'));
        dispatch(newAction(AppAction.startFollowingUser));
        dispatch(newAction(AppAction.scrollActivityList, { scrollTime: utils.now() })); // in onPressActivity
      }
      const appOptions = {
        centerTime: newTime,
        scrollTime: newTime,
        selectedActivityId: activity.id,
        viewTime: newTime,
      }
      log.debug('onPressActivity appOptions', appOptions);
      dispatch(newAction(AppAction.setAppOption, appOptions));
      dispatch(newAction(AppAction.zoomToActivity, { id: activity.id, zoomMap: true, zoomTimeline: true })); // in onPressActivity
    }
  }
  const onScroll = (x: number) => {
    // dispatch(newAction(AppAction.scrollTimeline, { scrollTime: t }));
  }
  const register = (component) => {
    setTimeout(() => {
      dispatch(newAction(AppAction.setRef, { activityList: component }));
    }, 0) // note the purpose of the setTimeout 0 is to defer this until we are out of the render of the ActivityList.
  }
  const dispatchers = {
    onPressActivity,
    onScroll,
    register,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
