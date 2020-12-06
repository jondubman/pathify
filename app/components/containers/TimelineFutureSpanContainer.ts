// "FutureSpan" indicates the future on the timeline, from nowTime on.

import { connect } from 'react-redux';

import {
  timepointVisibleOnTimeline,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import TimelineFutureSpan from 'presenters/TimelineFutureSpan';

interface TimelineFutureSpanStateProps {
  nowTime: number;
  visible: boolean;
}

interface TimelineFutureSpanDispatchProps {
}

export type TimelineFutureSpanProps = TimelineFutureSpanStateProps & TimelineFutureSpanDispatchProps;

const mapStateToProps = (state: AppState): TimelineFutureSpanStateProps => {
  const { nowTime } = state.options;
  const visible = timepointVisibleOnTimeline(state, nowTime);
  return {
    nowTime,
    visible,
  }
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
