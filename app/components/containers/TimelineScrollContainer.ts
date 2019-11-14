import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { AppAction, newAction } from 'lib/actions';
import {
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  timelineVisibleTime,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import TimelineScroll from 'presenters/TimelineScroll';

export interface TimelineScrollStateProps {
  refTime: number;
  scrollableWidth: number;
  scrollToX: number;
  timelineRefTime: number;
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
  const { refTime, timelineRefTime } = state.options;
  return {
    refTime,
    scrollableWidth: dynamicTimelineScrollWidth(state), // scrollable width
    // to calc scrollToX: start at the center of the scrollable area, then back up half the width of the visible area.
    scrollToX: (dynamicTimelineScrollWidth(state) / 2) - (dynamicTimelineWidth(state) / 2),
    timelineRefTime,
    visibleTime: timelineVisibleTime(state.options.timelineZoomValue),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineScrollDispatchProps => {
  const setTimelineNow = (enabled: boolean) => {
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'timelineNow'));
  }
  const setTimelineScrolling = (enabled: boolean) => {
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'timelineScrolling'));
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
