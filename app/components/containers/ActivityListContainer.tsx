import { connect } from 'react-redux';
import {
  FlatList,
} from 'react-native';

import constants from 'lib/constants';
import {
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityList from 'presenters/ActivityList';
import {
  ActivityUpdate,
} from 'shared/activities';
import log from 'shared/log';

interface ActivityListStateProps {
  list: ActivityUpdate[];
  top: number;
}

interface ActivityListDispatchProps {
  registerRef: (ref: FlatList<ActivityUpdate>) => void;
}

export type ActivityListProps = ActivityListStateProps & ActivityListDispatchProps;

const registerRef = (ref: FlatList<ActivityUpdate>) => {
  log.debug('registerRef TODO');
}

const mapStateToProps = (state: AppState): ActivityListStateProps => {
  return {
    list: state.cache.activities || [],
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityListDispatchProps => {
  const dispatchers = {
    registerRef,
  }
  return dispatchers;
}

const ActivityListContainer = connect<ActivityListStateProps, ActivityListDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityList as any);

export default ActivityListContainer;
