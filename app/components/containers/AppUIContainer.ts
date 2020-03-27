import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import {
  dynamicTimelineHeight,
  mapIsFullScreen,
  shouldShowTimeline,
 } from 'lib/selectors';
import { AppState } from 'lib/state';

interface AppUIStateProps {
  introMode: boolean;
  mapFullScreen: boolean;
  mapTapped: boolean;
  showActivityInfo: boolean;
  showTimeline: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  const {
    introMode,
    mapTapped,
    showActivityInfo,
  } = state.flags;
  return {
    introMode,
    mapFullScreen: mapIsFullScreen(state),
    mapTapped,
    showActivityInfo: showActivityInfo,
    showTimeline: shouldShowTimeline(state),
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
