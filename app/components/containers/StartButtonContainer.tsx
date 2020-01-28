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
  bottomOffset: number;
  startMenuOpen: boolean;
  trackingActivity: boolean;
}

interface StartButtonDispatchProps {
  onPressIn: (event: GestureResponderEvent) => void;
}

export type StartButtonProps = StartButtonStateProps & StartButtonDispatchProps;

const mapStateToProps = (state: AppState): StartButtonStateProps => {
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    startMenuOpen: state.flags.startMenuOpen,
    trackingActivity: state.flags.trackingActivity,
  }
}

const mapDispatchToProps = (dispatch: Function): StartButtonDispatchProps => {
  const onPressIn = (event: GestureResponderEvent) => {
    log.debug('StartButton press');
    dispatch(newAction(AppAction.closePanels, { option: 'otherThanStartMenu' }));
    dispatch(newAction(AppAction.flagToggle, 'startMenuOpen'));
  }
  const dispatchers = {
    onPressIn,
  }
  return dispatchers;
}

const StartButtonContainer = connect<StartButtonStateProps, StartButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(StartButton as any);

export default StartButtonContainer;
