import React, {
  Component,
} from 'react';
import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';


import {
  AppAction,
  newAction,
  SelectActivityParams,
} from 'lib/actions';
import {
  ActivityDataExtended,
} from 'lib/activities';
import {
  activityColorForSelectedActivity,
  dynamicTopBelowButtons,
  shouldShowActivityList,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import ActivityList from 'presenters/ActivityList';
import log from 'shared/log';
import { listedActivities } from 'lib/selectors';
import { Timepoint } from 'lib/timeseries';

interface ActivityListStateProps {
  activityColorOpacity: number;
  colorizeActivities: boolean;
  currentActivityId: string | null;
  labelsEnabled: boolean;
  list: ActivityDataExtended[];
  refreshCount: number;
  selectedActivityColor: string;
  selectedActivityId: string | null;
  timelineNow: boolean;
  trackingActivity: boolean;
  top: number;
  visible: boolean;
}

interface ActivityListDispatchProps {
  onPressActivity: (id: string) => void;
  onPressFutureZone: () => void;
  register: (component: Component) => void;
  scrollTimeline: (t: Timepoint) => void;
  setTimelineNow: (enabled: boolean) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  const {
    colorizeActivities,
    labelsEnabled,
    timelineNow,
    trackingActivity,
  } = state.flags;
  const {
    activityColorOpacity,
    currentActivityId,
    selectedActivityId,
  } = state.options;
  return {
    activityColorOpacity,
    colorizeActivities,
    currentActivityId,
    labelsEnabled,
    list: listedActivities(state),
    refreshCount: state.cache.refreshCount,
    selectedActivityColor: activityColorForSelectedActivity(state),
    selectedActivityId,
    timelineNow,
    trackingActivity,
    top: dynamicTopBelowButtons(),
    visible: shouldShowActivityList(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const onPressActivity = (id: string): void => {
    ReactNativeHaptic.generate('impactLight');
    dispatch(newAction(AppAction.selectActivity, { id } as SelectActivityParams));
  }
  const onPressFutureZone = (): void => {
    ReactNativeHaptic.generate('impactHeavy');
    log.trace('ActivityListContainer onPressFutureZone');
    dispatch(newAction(AppAction.activityListReachedEnd));
    const now = utils.now();
    dispatch(newAction(AppAction.scrollActivityList, { scrollTime: now })); // in onPressFutureZone
  }
  const register = (component) => {
    setTimeout(() => {
      dispatch(newAction(AppAction.setRef, { activityList: component }));
    }, 0) // note the purpose of the setTimeout 0 is to defer this until we are out of the render of the ActivityList.
  }
  const scrollTimeline = (t: Timepoint) => {
    log.scrollEvent('ActivityListContainer scrollTimeline', t);
    dispatch(newAction(AppAction.flagEnable, 'activityListScrolling'));
    dispatch(newAction(AppAction.activityListScrolled, { t }));
    dispatch(newAction(AppAction.flagDisable, 'activityListScrolling'));
  }
  const setTimelineNow = (enabled: boolean) => {
    log.trace('ActivityListContainer: setTimelineNow', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'timelineNow'));
  }
  const dispatchers = {
    onPressActivity,
    onPressFutureZone,
    register,
    scrollTimeline,
    setTimelineNow,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
