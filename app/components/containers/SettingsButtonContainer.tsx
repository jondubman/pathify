import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, appAction } from 'lib/actions';
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
    open: state.ui.panels.settings.open,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('SettingsButton press');
    dispatch(newAction(appAction.TOGGLE_PANEL_VISIBILITY, 'settings'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const SettingsButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
) (SettingsButton as any);

export default SettingsButtonContainer;
