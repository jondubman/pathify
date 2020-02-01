import { connect } from 'react-redux';

import { showActivityList } from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityInfo from 'presenters/ActivityInfo';

interface ActivityInfoStateProps {
  showActivityDetails: boolean;
  showActivityList: boolean;
}

interface ActivityInfoDispatchProps {
}

export type ActivityInfoProps = ActivityInfoStateProps & ActivityInfoDispatchProps;

const mapStateToProps = (state: AppState): ActivityInfoStateProps => {
  const {
    mapFullScreen,
    mapTapped,
    showActivityDetails
  } = state.flags;
  return {
    // showActivityDetails in mapFullScreen unless mapTapped.
    showActivityDetails: showActivityDetails && (!mapFullScreen || (mapFullScreen && !mapTapped)),
    // In contrast, ActiviyList is generally hidden in mapFullScreen mode.
    showActivityList: showActivityList(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityInfoDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const ActivityInfoContainer = connect<ActivityInfoStateProps, ActivityInfoDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityInfo as any);

export default ActivityInfoContainer;
