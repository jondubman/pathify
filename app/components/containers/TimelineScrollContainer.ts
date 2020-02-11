import React, {
  Component,
} from 'react';
import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { AppAction, newAction } from 'lib/actions';
import {
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  shouldShowTimeline,
  timelineVisibleTime,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import TimelineScroll from 'presenters/TimelineScroll';
import log from 'shared/log';

export interface TimelineScrollStateProps {
  centerTime: number;
  decelerationRate: number;
  pinchZoom: boolean;
  scrollableWidth: number;
  scrollToX: number;
  showTimeline: boolean;
  timelineZoomValue: number;
  visibleTime: number;
  visibleWidth: number;
}

export interface TimelineScrollDispatchProps {
  register: (component: Component) => void;
  setTimelineNow: (enabled: boolean) => void;
  setTimelineScrolling: (enabled: boolean) => void;
  zoomDomainChanged: (domain: DomainPropType) => void; // used only in response to user actions
  zoomDomainChanging: (domain: DomainPropType) => void; // used only in response to user actions
}

export type TimelineScrollProps = TimelineScrollStateProps & TimelineScrollDispatchProps;

const mapStateToProps = (state: AppState): TimelineScrollStateProps => {
  const {
    decelerationRate,
    centerTime,
    timelineZoomValue,
  } = state.options;
  // scrollPositionAtCenter: scroll position of the left edge of the scrollArea.
  // To calculate, start at the center of the scrollable area, then back up half the width of the visible area:
  const scrollableWidth = dynamicTimelineScrollWidth(state);
  const scrollPositionAtCenter = (scrollableWidth / 2) - (dynamicTimelineWidth(state) / 2);
  const visibleTime = timelineVisibleTime(timelineZoomValue);
  const visibleWidth = dynamicTimelineWidth(state);
  return {
    centerTime,
    decelerationRate,
    pinchZoom: state.flags.timelinePinchToZoom,
    scrollableWidth,
    scrollToX: scrollPositionAtCenter,
    showTimeline: shouldShowTimeline(state),
    timelineZoomValue,
    visibleTime,
    visibleWidth,
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineScrollDispatchProps => {
  const register = (component) => {
    setTimeout(() => {
      dispatch(newAction(AppAction.setRef, { timelineScroll: component }));
    }, 0) // note the purpose of the setTimeout 0 is to defer this until we are out of the render of the TimelineScroll.
  }
  const setTimelineNow = (enabled: boolean) => {
    log.trace('TimelineScrollContainer: setTimelineNow', enabled);
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
    register,
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
