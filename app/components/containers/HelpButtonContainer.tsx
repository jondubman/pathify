import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/state';
import HelpButton from 'presenters/HelpButton';

interface HelpButtonStateProps {
  enabled: boolean;
}

interface HelpButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type HelpButtonProps = HelpButtonStateProps & HelpButtonDispatchProps;

const mapStateToProps = (state: AppState): HelpButtonStateProps => {
  return {
    enabled: state.ui.flags.helpEnabled,
  }
}

const mapDispatchToProps = (dispatch: Function): HelpButtonDispatchProps => {
  const onPress = () => {
    log.debug('HelpButton press');
    dispatch(newAction(reducerAction.UI_FLAG_TOGGLE, 'helpEnabled'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const HelpButtonContainer = connect<HelpButtonStateProps, HelpButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpButton as any);

export default HelpButtonContainer;
