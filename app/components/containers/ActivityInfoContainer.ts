import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import ActivityInfo from 'presenters/ActivityInfo';

interface ActivityInfoStateProps {
}

interface ActivityInfoDispatchProps {
}

export type ActivityInfoProps = ActivityInfoStateProps & ActivityInfoDispatchProps;

const mapStateToProps = (state: AppState): ActivityInfoStateProps => {
  return {
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
