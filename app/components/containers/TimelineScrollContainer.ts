import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { AppAction, newAction } from 'lib/actions';
import {
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  timelineVisibleTime,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import TimelineScroll from 'presenters/TimelineScroll';

export interface TimelineScrollStateProps {
  decelerationRate: number;
  scrollableWidth: number;
  scrollToX: number;
  viewTime: number;
  visibleTime: number;
}

export interface TimelineScrollDispatchProps {
  setTimelineNow: (enabled: boolean) => void;
  setTimelineScrolling: (enabled: boolean) => void;
  zoomDomainChanged: (domain: DomainPropType) => void; // used only in response to user actions
  zoomDomainChanging: (domain: DomainPropType) => void; // used only in response to user actions
}

export type TimelineScrollProps = TimelineScrollStateProps & TimelineScrollDispatchProps;

const mapStateToProps = (state: AppState): TimelineScrollStateProps => {
  const { decelerationRate, viewTime } = state.options;
  return {
    decelerationRate,
    scrollableWidth: dynamicTimelineScrollWidth(state), // scrollable width
    // To calc scrollToX: start at the center of the scrollable area, then back up half the width of the visible area,
    // yielding the desired scroll position of the left edge of the scrollArea.
    scrollToX: (dynamicTimelineScrollWidth(state) / 2) - (dynamicTimelineWidth(state) / 2),
    viewTime,
    visibleTime: timelineVisibleTime(state.options.timelineZoomValue),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineScrollDispatchProps => {
  const setTimelineNow = (enabled: boolean) => {
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'timelineNow'));
  }
  const setTimelineScrolling = (enabled: boolean) => {
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'timelineScrolling'));
    if (enabled) {
      setTimelineNow(false);
    }
  }
  const zoomDomainChanged = (domain: DomainPropType) => {
    dispatch(newAction(AppAction.timelineZoomed, domain));
  }
  const zoomDomainChanging = (domain: DomainPropType) => {
    dispatch(newAction(AppAction.timelineZooming, domain));
  }
  const dispatchers = {
    setTimelineNow,
    setTimelineScrolling,
    zoomDomainChanged,
    zoomDomainChanging,
  }
  return dispatchers;
}

const TimelineScrollContainer = connect<TimelineScrollStateProps, TimelineScrollDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineScroll as any);

export default TimelineScrollContainer;
