import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import {
  clockNowMode
} from 'lib/selectors';
import { AppState } from 'lib/state';
import log from 'shared/log';

import Clock from 'presenters/Clock';

interface ClockStateProps {
  hours: number,
  minutes: number,
  seconds: number,
  timelineNow: boolean;
}

interface ClockDispatchProps {
  onPress: () => void;
}

export type ClockProps = ClockStateProps & ClockDispatchProps;

const mapStateToProps = (state: AppState): ClockStateProps => {
  const d = new Date(state.options.refTime);
  return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    timelineNow: clockNowMode(state),
  }
}

const mapDispatchToProps = (dispatch: Function): ClockDispatchProps => {
  const onPress = () => {
    log.debug('clock press');
    dispatch(newAction(AppAction.clockPress));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const ClockContainer = connect<ClockStateProps, ClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default ClockContainer;
