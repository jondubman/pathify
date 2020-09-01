import { connect } from 'react-redux';

import {
  shouldShowActivityList,
  showActivityDetailsRowsPreview,
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
    showActivityDetails: showActivityDetailsRowsPreview(state) > 0,
    showActivityList: shouldShowActivityList(state),
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
