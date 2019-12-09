import { connect } from 'react-redux';
import {
  FlatList,
} from 'react-native';

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
  selectedActivityId: string;
  refTime: number;
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
    selectedActivityId: state.options.selectedActivityId,
    refTime: state.options.refTime,
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const onPressActivity = (activity: ActivityDataExtended): void => {
    if (activity && activity.tStart) {
      log.debug('onPressActivity', activity.id);
      if (activity.tEnd) {
        dispatch(newAction(AppAction.flagDisable, 'timelineNow'));
        const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
                                        (activity.tStart + (activity.tLastUpdate || activity.tStart)) / 2;
        dispatch(newAction(AppAction.setAppOption, {
          refTime: newTime,
          timelineRefTime: newTime,
        }))
      } else {
        // This is the currentActivity.
        dispatch(newAction(AppAction.flagEnable, 'timelineNow'));
        dispatch(newAction(AppAction.startFollowingUser));
      }
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
