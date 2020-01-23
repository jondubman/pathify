import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { currentActivityIsSelected } from 'lib/selectors';
import { AppState } from 'lib/state';

import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

interface OwnProps { // matching those of NowClockContainer
  interactive: boolean;
}

const mapStateToProps = (state: AppState, ownProps?: OwnProps): ClockStateProps => {
  const { pausedTime, scrollTime, selectedActivityId } = state.options;
  const selectedIsCurrent = currentActivityIsSelected(state);
  const d = new Date(state.flags.timelineScrolling ? scrollTime : pausedTime);
  return {
    current: selectedIsCurrent,
    selected: !!selectedActivityId,
    hours: d.getHours(),
    milliseconds: d.getMilliseconds(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: !state.flags.ticksEnabled,
    nowMode: false,
    interactive: !!ownProps && ownProps.interactive,
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps?: OwnProps): ClockDispatchProps => {
  const onPress = () => {
    if (ownProps && ownProps.interactive) {
      dispatch(newAction(AppAction.clockPress, { nowClock: false }));
    }
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const PausedClockContainer = connect<ClockStateProps, ClockDispatchProps, OwnProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default PausedClockContainer;
