import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import {
  selectedOrCurrentActivity,
  dynamicTimelineHeight,
  menuOpen,
 } from 'lib/selectors';
import { AppState } from 'lib/state';

interface AppUIStateProps {
  mapFullScreen: boolean;
  showActivityInfo: boolean;
  showDebugInfo: boolean;
  showTimeline: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  const { appActive, mapFullScreen, showActivityInfo, showDebugInfo, showTimeline } = state.flags;
  return {
    mapFullScreen,
    showActivityInfo: showActivityInfo && appActive,
    showDebugInfo: showDebugInfo && !!selectedOrCurrentActivity(state) && !menuOpen(state) && appActive,
    showTimeline: showTimeline && !mapFullScreen && appActive,
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
