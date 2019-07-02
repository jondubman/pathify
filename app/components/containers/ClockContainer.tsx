import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/state';

import Clock from 'presenters/Clock';

interface ClockStateProps {
  hours: number,
  minutes: number,
  seconds: number,
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
  }
}

const mapDispatchToProps = (dispatch: Function): ClockDispatchProps => {
  const onPress = () => {
    log.debug('clock press'); // TODO for now, pressing the clock toggles timelineNow mode
    dispatch(newAction(AppAction.uiFlagToggle, 'timelineNow'));
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
