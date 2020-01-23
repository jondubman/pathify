import { connect } from 'react-redux';

import { Timespans } from 'containers/TimelineContainer';
import {
  timelineTimespans,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import TimelineSpans from 'presenters/TimelineSpans';

export interface TimelineSpansStateProps {
  data: Timespans;
}

export interface TimelineSpansDispatchProps {
}

export type TimelineSpansProps = TimelineSpansStateProps & TimelineSpansDispatchProps;

const mapStateToProps = (state: AppState): TimelineSpansStateProps => {
  const timespans: Timespans = timelineTimespans(state);
  return {
    data: timespans,
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineSpansDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineSpansContainer = connect<TimelineSpansStateProps, TimelineSpansDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineSpans as any);

export default TimelineSpansContainer;
