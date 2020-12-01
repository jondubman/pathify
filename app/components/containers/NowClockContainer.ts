import {
} from 'react-native';
import { connect } from 'react-redux';

// import { AppAction, newAction } from 'lib/actions';
import { currentActivityIsSelected } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

interface OwnProps { // matching those of PausedClockContainer
  clockStyle: Object;
  interactive: boolean;
}

const mapStateToProps = (state: AppState, ownProps?: OwnProps): ClockStateProps => {
  const { selectedActivityId } = state.options;
  const selectedIsCurrent = currentActivityIsSelected(state);

  // The use of now here ensures the NowClock is as up-to-date and thus smooth as can be, particularly the second hand.
  // Whatever now was determined somewhere earlier in the react-redux dynamic couldn't possibly be as up to date.
  const d = new Date(utils.now());
  return {
    clockStyle: (ownProps && ownProps.clockStyle) ? ownProps.clockStyle : {},
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
