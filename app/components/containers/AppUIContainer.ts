import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import {
  selectedOrCurrentActivity,
  dynamicTimelineHeight,
  menuOpen,
 } from 'lib/selectors';
import { AppState } from 'lib/state';

interface AppUIStateProps {
  showActivityInfo: boolean;
  showDebugInfo: boolean;
  showTimeline: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  return {
    showActivityInfo: state.flags.showActivityInfo,
    showDebugInfo: state.flags.showDebugInfo && !!selectedOrCurrentActivity(state) && !menuOpen(state),
    showTimeline: state.flags.showTimeline && !state.flags.mapFullScreen,
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
