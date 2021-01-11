import { connect } from 'react-redux';

import {
  uiCategories,
  UICategory,
} from 'lib/intro';
import {
  dynamicTimelineHeight,
  fullScreenUiMinimized,
  mapIsFullScreen,
  shouldShowTimeline,
 } from 'lib/selectors';
import { AppState } from 'lib/state';
import AppUI from 'presenters/AppUI';

interface AppUIStateProps {
  introMode: boolean;
  mapFullScreen: boolean;
  mapTapped: boolean;
  movieMode: boolean;
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
    movieMode,
    showActivityInfo,
    showGrabBar,
  } = state.flags;
  let ui = uiCategories(state);
  if (fullScreenUiMinimized(state)) {
    ui = ui.filter(category => category != UICategory.follow);
  }
  return {
    introMode,
    mapFullScreen: mapIsFullScreen(state),
    mapTapped,
    movieMode,
    showActivityInfo,
    showGrabBar: showGrabBar && ui.includes(UICategory.activities) || ui.includes(UICategory.grabBar),
    showTimeline: shouldShowTimeline(state) && ui.includes(UICategory.activities),
    timelineHeight: dynamicTimelineHeight(state),
    ui,
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
