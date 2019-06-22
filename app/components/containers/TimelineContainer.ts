import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { continuousTrackList, customTimespans } from 'lib/selectors';
import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';
import timeseries, { TimeRange } from 'shared/timeseries';
import { TimespanKind } from 'lib/constants';

export interface Timespan {
  kind: TimespanKind;
  tr: TimeRange;
}

export type Timespans = Timespan[];

export interface TimelineStateProps {
  nowTime: number;
  refTime: number;
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
  const nowTime = Date.now();
  const refTime = state.options.refTime;
  let timespans = continuousTrackList(state).map(track => {
    return {
      kind: TimespanKind.locations,
      tr: track.tr,
    }
  })
  timespans = timespans.concat(customTimespans(state));
  log.debug('timespans', timespans);
  return {
    nowTime,
    refTime,
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
    dispatch(newAction(appAction.timelineZoomed, domain));
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
