import { connect } from 'react-redux';

import {
  showActivityList,
  shouldShowActivityDetails,
} from 'lib/selectors';
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
  return {
    showActivityDetails: shouldShowActivityDetails(state),
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
