import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { trackList } from 'lib/selectors';
import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';
import { TimeRange } from 'shared/timeseries';

export interface TimelineStateProps {
  refTime: number;
  timelineNow: boolean;
  timespansData: TimeRange[];
}

export interface TimelineDispatchProps {
  zoomDomainChanged: (domain: DomainPropType) => void;
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  return {
    refTime: state.options.refTime,
    timelineNow: state.ui.flags.timelineNow,
    timespansData: trackList(state).map(track => track.tr),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const zoomDomainChanged = (domain: DomainPropType) => {
    // This responds to user interaction, adjusting the refTime. Not needed for programmatic adjustments to Timeline.
    log.trace('zoomDomainChanged', domain);
    dispatch(newAction(appAction.TIMELINE_ZOOMED, domain));
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
