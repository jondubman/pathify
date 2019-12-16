import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import utils from 'lib/utils';

import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

const mapStateToProps = (state: AppState): ClockStateProps => {
  const d = new Date(utils.now());
  return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: !state.flags.ticksEnabled,
    nowMode: true,
  }
}

const mapDispatchToProps = (dispatch: Function): ClockDispatchProps => {
  const onLongPress = () => {
    dispatch(newAction(AppAction.clockPress, { long: true, nowClock: true }));
  }
  const onPress = () => {
    dispatch(newAction(AppAction.clockPress, { long: false, nowClock: true }));
  }
  const dispatchers = {
    onLongPress,
    onPress,
  }
  return dispatchers;
}

const NowClockContainer = connect<ClockStateProps, ClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default NowClockContainer;
