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
import { Timepoint } from 'shared/timeseries';

interface ActivityListStateProps {
  animated: boolean;
  currentActivityId: string | null;
  list: ActivityDataExtended[];
  refreshCount: number;
  selectedActivityId: string | null;
  timelineNow: boolean;
  trackingActivity: boolean;
  top: number;
}

interface ActivityListDispatchProps {
  onPressActivity: (activity: ActivityDataExtended) => void;
  onPressFutureZone: () => void;
  onScrollTimeline: (t: Timepoint) => void;
  register: (component: Component) => void;
  reachedEnd: () => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  return {
    // animated: state.flags.timelineScrolling,
    animated: false, // TODO disabled for now
    currentActivityId: currentActivityId,
    list: state.cache.activities || [],
    refreshCount: state.cache.refreshCount,
    selectedActivityId: selectedActivityId,
    timelineNow: state.flags.timelineNow,
    trackingActivity: state.flags.trackingActivity,
    top: dynamicTopBelowButtons(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  // TODO move most of this to selectActivity saga so it can be triggered independently
  const onPressActivity = (activity: ActivityDataExtended): void => {
    if (activity) {
      log.debug('onPressActivity', activity.id);
      const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
        (activity.tStart + utils.now()) / 2;
      if (activity.tEnd) {
        // Pressing some prior activity.
        dispatch(newAction(AppAction.flagDisable, 'timelineNow'));
        dispatch(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in onPressActivity
      } else {
        // Pressing the currentActivity.
        log.debug('onPressActivity: Pressing the currentActivity', new Date(newTime).toString());
        dispatch(newAction(AppAction.scrollActivityList, { scrollTime: newTime })); // in onPressActivity
      }
      const appOptions = {
        centerTime: newTime, // TODO is it necessary to set this here?
        scrollTime: newTime,
        selectedActivityId: activity.id,
        viewTime: newTime,
      }
      log.debug('onPressActivity appOptions', appOptions);
      dispatch(newAction(AppAction.setAppOption, appOptions));
      dispatch(newAction(AppAction.zoomToActivity, { id: activity.id, zoomMap: true, zoomTimeline: true })); // in onPressActivity
    }
  }
  const onPressFutureZone = (): void => {
    dispatch(newAction(AppAction.activityListReachedEnd));
    const now = utils.now();
    dispatch(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in onPressFutureZone
  }
  const onScrollTimeline = (t: Timepoint) => {
    dispatch(newAction(AppAction.flagEnable, 'activityListScrolling'));
    dispatch(newAction(AppAction.activityListScrolled, { t }));
    dispatch(newAction(AppAction.flagDisable, 'activityListScrolling'));
  }
  const reachedEnd = () => {
    dispatch(newAction(AppAction.activityListReachedEnd));
  }
  const register = (component) => {
    setTimeout(() => {
      dispatch(newAction(AppAction.setRef, { activityList: component }));
    }, 0) // note the purpose of the setTimeout 0 is to defer this until we are out of the render of the ActivityList.
  }
  const dispatchers = {
    onPressActivity,
    onPressFutureZone,
    onScrollTimeline,
    reachedEnd,
    register,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
