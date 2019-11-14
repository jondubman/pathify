import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import TimelineControls from 'presenters/TimelineControls';
import { dynamicTimelineHeight } from 'lib/selectors';

interface TimelineControlsStateProps {
  nowMode: boolean;
  timelineHeight: number;
}

interface TimelineControlsDispatchProps {
}

export type TimelineControlsProps = TimelineControlsStateProps & TimelineControlsDispatchProps;

const mapStateToProps = (state: AppState): TimelineControlsStateProps => {
  return {
    nowMode: state.flags.timelineNow,
    timelineHeight: dynamicTimelineHeight(state),
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineControlsDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineControlsContainer = connect<TimelineControlsStateProps, TimelineControlsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineControls as any);

export default TimelineControlsContainer;
