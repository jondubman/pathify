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
  top: number;
}

interface ActivityListDispatchProps {
  onPressActivity: (activity: ActivityDataExtended) => void;
  registerRef: (ref: FlatList<ActivityDataExtended>) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

let _ref: FlatList<ActivityDataExtended>;

const registerRef = (ref: FlatList<ActivityDataExtended>) => {
  // TODO Here, we have a ref to control the FlatList (https://facebook.github.io/react-native/docs/flatlist)
  _ref = ref;
}

export const ActivityList_scrollToIndex = (params) => {
  if (_ref) {
    _ref.scrollToIndex(params);
  }
}

export const ActivityList_scrollToOffset = (params) => {
  if (_ref) {
    _ref.scrollToOffset(params);
  }
}

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  return {
    list: state.cache.activities || [],
    refreshCount: state.cache.refreshCount,
    selectedActivityId: state.options.selectedActivityId,
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const onPressActivity = (activity: ActivityDataExtended): void => {
    if (activity) {
      log.debug('onPressActivity', activity.id);
      dispatch(newAction(AppAction.flagDisable, 'timelineNow'));
      if (activity.tStart) {
        const newTime = activity.tEnd ? (activity.tStart + activity.tEnd) / 2 :
                                        (activity.tStart + (activity.tLastUpdate || activity.tStart)) / 2;
        dispatch(newAction(AppAction.setAppOption, {
          refTime: newTime,
          timelineRefTime: newTime,
        }))
      }
    }
  }
  const dispatchers = {
    onPressActivity,
    registerRef,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
