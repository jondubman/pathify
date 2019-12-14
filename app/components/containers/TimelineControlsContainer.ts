import { connect } from 'react-redux';

import constants from 'lib/constants';
import { AppState } from 'lib/state';
import TimelineControls from 'presenters/TimelineControls';
import {
  dynamicClockBottom,
  dynamicTimelineHeight,
} from 'lib/selectors';
import utils from 'lib/utils';

interface TimelineControlsStateProps {
  bottom: number;
  mapFullScreen: boolean;
  nowMode: boolean;
  timelineHeight: number;
}

interface TimelineControlsDispatchProps {
}

export type TimelineControlsProps = TimelineControlsStateProps & TimelineControlsDispatchProps;

const mapStateToProps = (state: AppState): TimelineControlsStateProps => {
  return {
    bottom: dynamicClockBottom(state),
    mapFullScreen: state.flags.mapFullScreen,
    nowMode: state.flags.timelineNow || (state.options.scrollTime > utils.now() - constants.timing.timelineCloseToNow),
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
