import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import {
  dynamicTimelineHeight,
  mapIsFullScreen,
 } from 'lib/selectors';
import { AppState } from 'lib/state';

interface AppUIStateProps {
  mapFullScreen: boolean;
  mapTapped: boolean;
  showActivityInfo: boolean;
  timelineHeight: number;
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  const {
    mapTapped,
    showActivityInfo,
  } = state.flags;
  return {
    mapFullScreen: mapIsFullScreen(state),
    mapTapped,
    showActivityInfo: showActivityInfo,
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
