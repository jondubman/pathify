import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';

import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

interface OwnProps { // matching those of NowClockContainer
  interactive: boolean;
}

const mapStateToProps = (state: AppState, ownProps?: OwnProps): ClockStateProps => {
  const { currentActivityId, pausedTime, scrollTime, selectedActivityId } = state.options;
  const selectedIsCurrent = (selectedActivityId === currentActivityId);
  const d = new Date(state.flags.timelineScrolling ? scrollTime : pausedTime);
  return {
    current: selectedIsCurrent,
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: !state.flags.ticksEnabled,
    nowMode: false,
    interactive: !!ownProps && ownProps.interactive,
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps?: OwnProps): ClockDispatchProps => {
  const onLongPress = () => {
    if (ownProps && ownProps.interactive) {
      dispatch(newAction(AppAction.clockPress, { long: true, nowClock: false }));
    }
  }
  const onPress = () => {
    if (ownProps && ownProps.interactive) {
      dispatch(newAction(AppAction.clockPress, { long: false, nowClock: false }));
    }
  }
  const dispatchers = {
    onLongPress,
    onPress,
  }
  return dispatchers;
}

const PausedClockContainer = connect<ClockStateProps, ClockDispatchProps, OwnProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default PausedClockContainer;
