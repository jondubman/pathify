import { connect } from 'react-redux';

import {
  DomainPropType,
  DomainTuple,
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
  centerTime: number;
  pinchZoom: boolean;
  showFutureTimespan: boolean;
  showMarks: boolean;
  showSpans: boolean;
  timelineNow: boolean;
  timelineWidth: number;
  visibleTime: number;
  visibleWidth: number;
  zoomDomain: DomainPropType; // Note this prop is the only one that isn't a simple value, hence getZoomDomain.
  zoomLevel: number;
}

export interface TimelineDispatchProps {
}

export type TimelineProps = TimelineStateProps & TimelineDispatchProps;

let _zoomDomain: { x: [number, number], y: DomainTuple }; // most recently used visible domain of the Timeline

// TODO should probably use reselect library, as that solves the general case.
const getZoomDomain = (state: AppState) => {
  const { centerTime, timelineZoomValue } = state.options;
  const visibleTime = timelineVisibleTime(timelineZoomValue);
  const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
  const xMin = centerTime - scrollableAreaTime / 2;
  const xMax = centerTime + scrollableAreaTime / 2;
  const { yDomain } = constants.timeline;
  if (_zoomDomain && _zoomDomain.x[0] === xMin && _zoomDomain.x[1] === xMax) {
    return _zoomDomain; // reuse the cached object as means of avoiding unnecessary re-rendering of Timeline
  }
  // Make a new _zoomDomain
  _zoomDomain = { // the visible domain of the Timeline
    x: [xMin, xMax], // half on either side
    y: yDomain, // this never changes
  }
  return _zoomDomain;
}

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const {
    timelinePinchToZoom,
    showFutureTimespan,
    showTimelineMarks,
    showTimelineSpans,
    timelineNow
  } = state.flags;
  const {
    centerTime,
    timelineZoomValue
  } = state.options;
  const timelineWidth = dynamicTimelineScrollWidth(state); // scrollable width
  const visibleTime = timelineVisibleTime(timelineZoomValue);
  const visibleWidth = dynamicTimelineWidth(state);
  const zoomDomain = getZoomDomain(state);
  const zoomLevel = timelineZoomLevel(timelineZoomValue);
  return {
    centerTime,
    pinchZoom: timelinePinchToZoom,
    showFutureTimespan,
    showMarks: showTimelineMarks,
    showSpans: showTimelineSpans,
    timelineNow,
    timelineWidth,
    visibleTime,
    visibleWidth,
    zoomDomain,
    zoomLevel,
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
