import { connect } from 'react-redux';

import {
  uiCategories,
  UICategory
} from 'lib/intro';
import {
  dynamicTimelineHeight,
  mapIsFullScreen,
  shouldShowTimeline,
 } from 'lib/selectors';
import { AppState } from 'lib/state';
import AppUI from 'presenters/AppUI';

interface AppUIStateProps {
  introMode: boolean;
  mapFullScreen: boolean;
  mapTapped: boolean;
  showActivityInfo: boolean;
  showGrabBar: boolean;
  showTimeline: boolean;
  timelineHeight: number;
  ui: UICategory[];
}

interface AppUIDispatchProps {
}

export type AppUIProps = AppUIStateProps & AppUIDispatchProps;

const mapStateToProps = (state: AppState): AppUIStateProps => {
  const {
    introMode,
    mapTapped,
    showActivityInfo,
    showGrabBar,
  } = state.flags;
  return {
    introMode,
    mapFullScreen: mapIsFullScreen(state),
    mapTapped,
    showActivityInfo,
    showGrabBar,
    showTimeline: shouldShowTimeline(state),
    timelineHeight: dynamicTimelineHeight(state),
    ui: uiCategories(state),
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
