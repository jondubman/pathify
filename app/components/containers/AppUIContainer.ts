import { connect } from 'react-redux';

import {
  uiCategories,
  UICategory,
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
  const ui = uiCategories(state);
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
    showGrabBar: showGrabBar && ui.includes(UICategory.activities),
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
