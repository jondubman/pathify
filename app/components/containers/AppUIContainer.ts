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
  mapTapped: boolean;
  mapTapTogglesFullScreen: boolean;
  showActivityInfo: boolean;
  showDebugInfo: boolean;
  showTimeline: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  const {
    mapFullScreen,
    mapTapped,
    mapTapTogglesFullScreen,
    showActivityInfo,
    showDebugInfo,
    showTimeline
  } = state.flags;
  return {
    mapFullScreen,
    mapTapped,
    mapTapTogglesFullScreen,
    showActivityInfo: showActivityInfo,
    showDebugInfo: showDebugInfo && !!selectedOrCurrentActivity(state) && !menuOpen(state),
    showTimeline: showTimeline && !mapFullScreen,
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
