import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';

import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

const mapStateToProps = (state: AppState): ClockStateProps => {
  const d = new Date(state.flags.timelineScrolling ? state.options.scrollTime : state.options.pausedTime);
    return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: !state.flags.ticksEnabled,
    nowMode: false,
  }
}

const mapDispatchToProps = (dispatch: Function): ClockDispatchProps => {
  const onLongPress = () => {
    dispatch(newAction(AppAction.clockPress, { long: true, nowClock: false }));
  }
  const onPress = () => {
    dispatch(newAction(AppAction.clockPress, { long: false, nowClock: false }));
  }
  const dispatchers = {
    onLongPress,
    onPress,
  }
  return dispatchers;
}

const PausedClockContainer = connect<ClockStateProps, ClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default PausedClockContainer;
