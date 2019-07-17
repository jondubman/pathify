import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { AppAction, newAction } from 'lib/actions';
import { TimespanKind } from 'lib/constants';
import { continuousTrackList, customTimespans, selectedTimespans } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import Timeline from 'presenters/Timeline';
import log from 'shared/log';
import timeseries, { TimeRange } from 'shared/timeseries';
import { Track } from 'shared/tracks';

export interface Timespan {
  kind: TimespanKind;
  tr: TimeRange;
}

export type Timespans = Timespan[];

export interface TimelineStateProps {
  allowZoom: boolean;
  nowTime: number;
  refTime: number;
  startupTime: number;
  timelineNow: boolean;
  timeRange: TimeRange;
  timespans: Timespans;
  zoomLevel: number;
}

export interface TimelineDispatchProps {
  zoomDomainChanged: (domain: DomainPropType) => void; // used only in response to user actions
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  const nowTime = utils.now();
  const refTime = state.options.refTime;
  const allowZoom = state.ui.flags.allowContinuousTimelineZoom;
  const tracks = continuousTrackList(state);
  let timespans: Timespans = tracks.map((track: Track): Timespan => ({
    kind: TimespanKind.locations,
    tr: track.tr,
  }))
  timespans = timespans.concat(customTimespans(state)).concat(selectedTimespans(state));
  return {
    allowZoom,
    nowTime,
    refTime,
    startupTime: state.options.startupTime,
    timelineNow: state.ui.flags.timelineNow,
    timeRange: timeseries.timeRangeOfEvents(state.events),
    timespans,
    zoomLevel: state.options.timelineZoomLevel,
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const zoomDomainChanged = (domain: DomainPropType) => {
    // This responds to user interaction, adjusting the refTime. Not needed to programmatically zoom Timeline.
    log.trace('zoomDomainChanged', domain);
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
