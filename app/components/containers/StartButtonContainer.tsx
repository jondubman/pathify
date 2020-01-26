import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicLowerButtonBase } from 'lib/selectors';
import { AppState } from 'lib/state';
import StartButton from 'presenters/StartButton';
import log from 'shared/log';

interface StartButtonStateProps {
  bottomOffset: number,
  enabled: boolean,
}

interface StartButtonDispatchProps {
  onStart: (event: GestureResponderEvent) => void;
  onStop: (event: GestureResponderEvent) => void;
}

export type StartButtonProps = StartButtonStateProps & StartButtonDispatchProps;

const mapStateToProps = (state: AppState): StartButtonStateProps => {
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    enabled: state.flags.trackingActivity,
  }
}

const mapDispatchToProps = (dispatch: Function): StartButtonDispatchProps => {
  const onStart = () => {
    log.debug('StartButton press START');
    dispatch(newAction(AppAction.startActivity));
  }
  const onStop = () => {
    log.debug('StartButton press STOP');
    dispatch(newAction(AppAction.stopActivity));
  }
  const dispatchers = {
    onStart,
    onStop,
  }
  return dispatchers;
}

const StartButtonContainer = connect<StartButtonStateProps, StartButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(StartButton as any);

export default StartButtonContainer;
