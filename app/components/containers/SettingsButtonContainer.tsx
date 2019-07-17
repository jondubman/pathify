import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import { AppState } from 'lib/state';
import log from 'shared/log';
import SettingsButton from 'presenters/SettingsButton';

interface SettingsButtonStateProps {
  open: boolean;
}

interface SettingsButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type SettingsButtonProps = SettingsButtonStateProps & SettingsButtonDispatchProps;

const mapStateToProps = (state: AppState): SettingsButtonStateProps => {
  return {
    open: state.panels.settings.open,
  }
}

const mapDispatchToProps = (dispatch: Function): SettingsButtonDispatchProps => {
  const onPress = () => {
    log.debug('SettingsButton press');
    dispatch(newAction(AppAction.togglePanelVisibility, 'settings'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const SettingsButtonContainer = connect<SettingsButtonStateProps, SettingsButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
) (SettingsButton as any);

export default SettingsButtonContainer;
