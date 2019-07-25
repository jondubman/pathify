import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import { dynamicTimelineHeight } from 'lib/selectors';
import { AppState } from 'lib/state';

interface AppUIStateProps {
  showTimeline: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  return {
    showTimeline: !state.flags.mapFullScreen,
    timelineHeight: dynamicTimelineHeight(state),
  }
}

const mapDispatchToProps = (dispatch: Function): AppUIDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const AppUIContainer = connect<AppUIStateProps, AppUIDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(AppUI as any);

export default AppUIContainer;
