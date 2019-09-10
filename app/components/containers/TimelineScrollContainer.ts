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
  scrollableWidth: number;
  scrollToX: number;
  timelineRefTime: number;
  visibleTime: number;
}

export interface TimelineScrollDispatchProps {
  zoomDomainChanged: (domain: DomainPropType) => void; // used only in response to user actions
  zoomDomainChanging: (domain: DomainPropType) => void; // used only in response to user actions
}

export type TimelineScrollProps = TimelineScrollStateProps & TimelineScrollDispatchProps;

const mapStateToProps = (state: AppState): TimelineScrollStateProps => {
  const { timelineRefTime } = state.options;
  return {
    scrollableWidth: dynamicTimelineScrollWidth(state), // scrollable width
    scrollToX: dynamicTimelineScrollWidth(state) / 2 - dynamicTimelineWidth(state) / 2,
    timelineRefTime,
    visibleTime: timelineVisibleTime(state.options.timelineZoomValue),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineScrollDispatchProps => {
  const zoomDomainChanged = (domain: DomainPropType) => {
    // This responds to user interaction, adjusting the refTime. Not needed to programmatically zoom Timeline.
    // log.trace('zoomDomainChanged', domain);
    dispatch(newAction(AppAction.timelineZoomed, domain));
  }
  const zoomDomainChanging = (domain: DomainPropType) => {
    dispatch(newAction(AppAction.timelineZooming, domain));
  }
  const dispatchers = {
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
