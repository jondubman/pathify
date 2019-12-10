import { connect } from 'react-redux';

import {
  DomainPropType,
} from 'victory-native';

import constants, { TimespanKind } from 'lib/constants';
import {
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  timelineVisibleTime,
  timelineZoomLevel,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';
import { TimeRange } from 'shared/timeseries';

export interface Timespan {
  kind: TimespanKind;
  tr: TimeRange;
  color?: string;
}

export type Timespans = Timespan[];

export interface TimelineStateProps {
  allowZoom: boolean;
  showMarks: boolean;
  showSpans: boolean;
  timelineNow: boolean;
  timelineWidth: number;
  viewTime: number;
  visibleTime: number;
  visibleWidth: number;
  zoomDomain: DomainPropType;
  zoomLevel: number;
}

export interface TimelineDispatchProps {
}

export type TimelineProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const { yDomain } = constants.timeline;
  const { viewTime } = state.options;
  const allowZoom = state.flags.timelinePinchToZoom;
  const timelineWidth = dynamicTimelineScrollWidth(state); // scrollable width
  const visibleTime = timelineVisibleTime(state.options.timelineZoomValue);
  const visibleWidth = dynamicTimelineWidth(state);
  const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
  const zoomDomain: DomainPropType = { // the visible domain of the Timeline
    x: [viewTime - scrollableAreaTime / 2, viewTime + scrollableAreaTime / 2], // half on either side
    y: yDomain,
  }
  const showMarks = state.flags.showTimelineMarks;
  const showSpans = state.flags.showTimelineSpans;
  return {
    allowZoom,
    showMarks,
    showSpans,
    timelineNow: state.flags.timelineNow,
    viewTime,
    timelineWidth,
    visibleTime,
    visibleWidth,
    zoomDomain,
    zoomLevel: timelineZoomLevel(state.options.timelineZoomValue),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineContainer = connect<TimelineStateProps, TimelineDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Timeline as any);

export default TimelineContainer;
