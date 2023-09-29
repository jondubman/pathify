import { connect } from 'react-redux';

import {
  uiCategories,
  UICategory,
} from 'lib/intro';
import { AppState } from 'lib/state';
import TimelineControls from 'presenters/TimelineControls';
import {
  bottomPaddingForAxis,
  dynamicRefTimeBottom,
  dynamicTimelineHeight,
} from 'lib/selectors';

interface TimelineControlsStateProps {
  bottomPaddingForAxis: number;
  refTimeBottom: number;
  safeAreaBottom: number;
  showCenterline: boolean;
  timelineHeight: number;
  timelineScrolling: boolean;
  zoomClockMoved: number;
}

interface TimelineControlsDispatchProps {
}

export type TimelineControlsProps = TimelineControlsStateProps & TimelineControlsDispatchProps;

const mapStateToProps = (state: AppState): TimelineControlsStateProps => {
  return {
    bottomPaddingForAxis: bottomPaddingForAxis(state),
    refTimeBottom: dynamicRefTimeBottom(state),
    safeAreaBottom: state.options.safeAreaInsets ? state.options.safeAreaInsets.bottom : 0,
    showCenterline: uiCategories(state).includes(UICategory.refTime),
    timelineHeight: dynamicTimelineHeight(state),
    timelineScrolling: state.flags.timelineScrolling,
    zoomClockMoved: state.options.zoomClockMoved,
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineControlsDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineControlsContainer = connect<TimelineControlsStateProps, TimelineControlsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineControls as any);

export default TimelineControlsContainer;
