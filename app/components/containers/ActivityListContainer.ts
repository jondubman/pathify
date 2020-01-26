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
  onPressActivity: (id: string) => void;
  onPressFutureZone: () => void;
  onScrollTimeline: (t: Timepoint) => void;
  register: (component: Component) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  const { timelineNow, trackingActivity } = state.flags;
  const { currentActivityId, selectedActivityId } = state.options;
  return {
    animated: false,
    currentActivityId,
    list: state.cache.activities || [], // TODO could filter activities
    refreshCount: state.cache.refreshCount,
    selectedActivityId,
    timelineNow,
    trackingActivity,
    top: dynamicTopBelowButtons(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const onPressActivity = (id: string): void => {
    dispatch(newAction(AppAction.selectActivity, { id }));
  }
  const onPressFutureZone = (): void => {
    log.trace('ActivityListContainer onPressFutureZone');
    dispatch(newAction(AppAction.activityListReachedEnd));
    const now = utils.now();
    dispatch(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in onPressFutureZone
  }
  const onScrollTimeline = (t: Timepoint) => {
    log.trace('ActivityListContainer onScrollTimeline', t);
    dispatch(newAction(AppAction.flagEnable, 'activityListScrolling'));
    dispatch(newAction(AppAction.activityListScrolled, { t }));
    dispatch(newAction(AppAction.flagDisable, 'activityListScrolling'));
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
    register,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
