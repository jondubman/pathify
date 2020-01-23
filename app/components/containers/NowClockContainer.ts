import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { currentActivityIsSelected } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';

import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

interface OwnProps { // matching those of PausedClockContainer
  interactive: boolean;
}

const mapStateToProps = (state: AppState, ownProps?: OwnProps): ClockStateProps => {
  const { selectedActivityId } = state.options;
  const selectedIsCurrent = currentActivityIsSelected(state);
  const d = new Date(utils.now());
  return {
    current: selectedIsCurrent,
    selected: !!selectedActivityId,
    hours: d.getHours(),
    milliseconds: d.getMilliseconds(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: !state.flags.ticksEnabled,
    nowMode: true,
    interactive: !!ownProps && ownProps.interactive,
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps?: OwnProps): ClockDispatchProps => {
  const onPress = () => {
    if (ownProps && ownProps.interactive) {
      dispatch(newAction(AppAction.clockPress, { nowClock: true }));
    }
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const NowClockContainer = connect<ClockStateProps, ClockDispatchProps, OwnProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default NowClockContainer;
