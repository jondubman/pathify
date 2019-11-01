import { connect } from 'react-redux';

import {
  DomainPropType,
} from 'victory-native';

import constants, { TimespanKind } from 'lib/constants';
import {
  continuousTrackList,
  timelineTimespans,
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  timelineVisibleTime,
  timelineZoomLevel,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';
import database from 'shared/database';
import {
  MarkEvents,
  markList
} from 'shared/marks';
import timeseries, { TimeRange } from 'shared/timeseries';

export interface Timespan {
  kind: TimespanKind;
  tr: TimeRange;
  color?: string;
}

export type Timespans = Timespan[];

export interface TimelineStateProps {
  allowZoom: boolean;
  currentActivityId: string;
  marks: MarkEvents;
  selectedActivityId: string;
  showMarks: boolean;
  showSpans: boolean;
  timelineNow: boolean;
  timelineRefTime: number;
  timelineWidth: number;
  timespans: Timespans;
  visibleTime: number;
  visibleWidth: number;
  zoomDomain: DomainPropType;
  zoomLevel: number;
}

export interface TimelineDispatchProps {
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const { yDomain } = constants.timeline;
  const { currentActivityId, selectedActivityId, timelineRefTime } = state.options;
  const allowZoom = state.flags.timelinePinchToZoom;
  const timelineWidth = dynamicTimelineScrollWidth(state); // scrollable width
  const visibleTime = timelineVisibleTime(state.options.timelineZoomValue);
  const visibleWidth = dynamicTimelineWidth(state);
  const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
  const zoomDomain: DomainPropType = { // the visible domain of the Timeline
    x: [timelineRefTime - scrollableAreaTime / 2, timelineRefTime + scrollableAreaTime / 2], // half on either side
    y: yDomain,
  }
  const showMarks = state.flags.showTimelineMarks;
  const showSpans = state.flags.showTimelineSpans;
  // if (timelineShowContinuousTracks) {
  //   const tracks: Tracks = state.flags.timelineShowContinuousTracks ? continuousTrackList(state) : [];
  //   const timespans: Timespans = tracks.map((track: Track): Timespan => ({
  //     kind: TimespanKind.LOCATIONS,
  //     tr: track.tr,
  //   }))
  // }
  const timespans: Timespans = showSpans ? timelineTimespans(state) : [];
  const marks: MarkEvents = showMarks ? markList(database.events()) : [];

  return {
    allowZoom,
    currentActivityId,
    marks,
    selectedActivityId,
    showMarks,
    showSpans,
    timelineNow: state.flags.timelineNow,
    timelineRefTime,
    timelineWidth,
    timespans,
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
