import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import TimelineFutureSpan from 'presenters/TimelineFutureSpan';

interface TimelineFutureSpanStateProps {
  nowTime: number;
}

interface TimelineFutureSpanDispatchProps {
}

export type TimelineFutureSpanProps = TimelineFutureSpanStateProps & TimelineFutureSpanDispatchProps;

const mapStateToProps = (state: AppState): TimelineFutureSpanStateProps => {
  const { nowTime } = state.options;
  return { nowTime };
}

const mapDispatchToProps = (dispatch: Function): TimelineFutureSpanDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineFutureSpanContainer = connect<TimelineFutureSpanStateProps, TimelineFutureSpanDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineFutureSpan as any);

export default TimelineFutureSpanContainer;
