import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/state';
import HelpButton from 'presenters/HelpButton';

interface StateProps {
  enabled: boolean;
}

interface DispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

const mapStateToProps = (state: AppState): StateProps => {
  return {
    enabled: state.ui.flags.helpEnabled,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('HelpButton press');
    dispatch(newAction(reducerAction.UI_FLAG_TOGGLE, 'helpEnabled'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const HelpButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpButton as any);

export default HelpButtonContainer;
