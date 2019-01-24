import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import SettingsButton from 'presenters/SettingsButton';

interface StateProps {
}

interface DispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

const mapStateToProps = (state: AppState): StateProps => {
  return {
    open: state.ui.flags.settingsOpen,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('SettingsButton press');
    dispatch(newAction(reducerAction.UI_FLAG_TOGGLE, 'settingsOpen'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const SettingsButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
) (SettingsButton as any); // TODO 'as any' addresses TS error 2345

export default SettingsButtonContainer;
