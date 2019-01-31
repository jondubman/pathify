import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import { MapStyle } from 'lib/constants';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import {
  dynamicMapStyle,
} from 'lib/selectors';
import SettingsPanel from 'presenters/SettingsPanel';

interface SettingsPanelStateProps {
  open: boolean;
  mapStyle: MapStyle;
}

interface SettingsPanelDispatchProps {
  onSelectMapStyle: (name: string) => void;
}

export type SettingsPanelProps = SettingsPanelStateProps & SettingsPanelDispatchProps;

const mapStateToProps = (state: AppState): SettingsPanelStateProps => {
  return {
    open: state.ui.flags.settingsOpen,
    mapStyle: dynamicMapStyle(state),
  }
}

const mapDispatchToProps = (dispatch: any): SettingsPanelDispatchProps => {
  const onSelectMapStyle = (name: string) => {
    log.debug('SettingsPanel onSelectMapStyle', name);
    dispatch(newAction(reducerAction.MAP_STYLE, name));
  }
  const dispatchers = {
    onSelectMapStyle,
  }
  return dispatchers;
}

const SettingsPanelContainer = connect<SettingsPanelStateProps, SettingsPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(SettingsPanel as any);

export default SettingsPanelContainer;
