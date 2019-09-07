import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { AppAction, newAction } from 'lib/actions';
import database from 'lib/database';
import { TimespanKind } from 'lib/constants';
import {
  continuousTrackList,
  customTimespans,
  selectionTimespans,
  timelineVisibleTime,
  timelineZoomLevel,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import Timeline from 'presenters/Timeline';
import log from 'shared/log';
import {
  Activity,
  MarkEvents,
  markList
} from 'shared/marks';
import timeseries, { Events, TimeRange } from 'shared/timeseries';
import { Track, Tracks } from 'shared/tracks';

export interface Timespan {
  kind: TimespanKind;
  tr: TimeRange;
  color?: string;
}

export type Timespans = Timespan[];

export interface TimelineStateProps {
  allowZoom: boolean;
  currentActivity: Activity | null;
  marks: MarkEvents;
  nowTime: number;
  refTime: number;
  selectedActivity: Activity | null;
  startupTime: number;
  timelineNow: boolean;
  timeRange: TimeRange;
  timespans: Timespans;
  visibleTime: number;
  zoomLevel: number;
}

export interface TimelineDispatchProps {
  zoomDomainChanged: (domain: DomainPropType) => void; // used only in response to user actions
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const { currentActivity, refTime } = state.options;
  const nowTime = utils.now();
  const allowZoom = state.flags.timelinePinchToZoom;
  const tracks: Tracks = state.flags.timelineShowContinuousTracks ? continuousTrackList(state) : [];
  const timespans: Timespans = tracks.map((track: Track): Timespan => ({
    kind: TimespanKind.LOCATIONS,
    tr: track.tr,
  })).concat(customTimespans(state)).concat(selectionTimespans(state));
  const marks: MarkEvents = markList(database.events());
  return {
    allowZoom,
    currentActivity,
    marks,
    nowTime,
    refTime,
    selectedActivity: state.options.selectedActivity,
    startupTime: state.options.startupTime,
    timelineNow: state.flags.timelineNow,
    timeRange: timeseries.timeRangeOfEvents(database.events()),
    timespans,
    visibleTime: timelineVisibleTime(state.options.timelineZoomValue),
    zoomLevel: timelineZoomLevel(state.options.timelineZoomValue),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const zoomDomainChanged = (domain: DomainPropType) => {
    // This responds to user interaction, adjusting the refTime. Not needed to programmatically zoom Timeline.
    // log.trace('zoomDomainChanged', domain);
    dispatch(newAction(AppAction.timelineZoomed, domain));
  }
  const dispatchers = {
    zoomDomainChanged,
  }
  return dispatchers;
}

const TimelineContainer = connect<TimelineStateProps, TimelineDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Timeline as any);

export default TimelineContainer;
