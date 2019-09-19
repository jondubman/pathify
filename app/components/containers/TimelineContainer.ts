import { connect } from 'react-redux';

import { TimespanKind } from 'lib/constants';
import {
  continuousTrackList,
  timelineTimespans,
  dynamicTimelineScrollWidth,
  dynamicTimelineWidth,
  timelineVisibleTime,
  timelineZoomLevel,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import Timeline from 'presenters/Timeline';
import database from 'shared/database';
import {
  MarkEvents,
  markList
} from 'shared/marks';
import timeseries, { TimeRange } from 'shared/timeseries';
// import { Track, Tracks } from 'shared/tracks'; // TODO3 remove

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
  nowTime: number;
  scrollToX: number;
  selectedActivityId: string;
  showMarks: boolean;
  showSpans: boolean;
  startupTime: number;
  timelineNow: boolean;
  timelineRefTime: number;
  timelineWidth: number;
  timeRange: TimeRange;
  timespans: Timespans;
  visibleTime: number;
  visibleWidth: number;
  zoomLevel: number;
}

export interface TimelineDispatchProps {
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const { currentActivityId, selectedActivityId, timelineRefTime } = state.options;
  const nowTime = utils.now();
  const allowZoom = state.flags.timelinePinchToZoom;
  // const tracks: Tracks = state.flags.timelineShowContinuousTracks ? continuousTrackList(state) : [];
  const showMarks = state.flags.showTimelineMarks;
  const showSpans = state.flags.showTimelineSpans;
  // const timespans: Timespans = tracks.map((track: Track): Timespan => ({
  //   kind: TimespanKind.LOCATIONS,
  //   tr: track.tr,
  // }))
  const timespans: Timespans = showSpans ? timelineTimespans(state) : [];
  const marks: MarkEvents = showMarks ? markList(database.events()) : [];

  return {
    allowZoom,
    currentActivityId,
    marks,
    nowTime,
    scrollToX: dynamicTimelineScrollWidth(state) / 2 - dynamicTimelineWidth(state) / 2,
    selectedActivityId,
    showMarks,
    showSpans,
    startupTime: state.options.startupTime,
    timelineNow: state.flags.timelineNow,
    timelineRefTime: timelineRefTime,
    timelineWidth: dynamicTimelineScrollWidth(state), // scrollable width
    timeRange: timeseries.timeRangeOfEvents(database.events()),
    timespans,
    visibleTime: timelineVisibleTime(state.options.timelineZoomValue),
    visibleWidth: dynamicTimelineWidth(state),
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
