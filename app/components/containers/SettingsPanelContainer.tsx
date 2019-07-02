import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { MapStyle } from 'lib/constants';
import log from 'lib/log';
import {
  dynamicMapStyle,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import SettingsPanel from 'presenters/SettingsPanel';

interface SettingsPanelStateProps {
  open: boolean;
  mapOpacity: number;
  mapStyle: MapStyle;
}

interface SettingsPanelDispatchProps {
  onSelectMapStyle: (name: string) => void;
  onSetMapOpacity: (opacity: number) => void;
}

export type SettingsPanelProps = SettingsPanelStateProps & SettingsPanelDispatchProps;

const mapStateToProps = (state: AppState): SettingsPanelStateProps => {
  return {
    open: state.ui.panels.settings.open,
    mapOpacity: state.options.mapOpacity,
    mapStyle: dynamicMapStyle(state),
  }
}

const mapDispatchToProps = (dispatch: Function): SettingsPanelDispatchProps => {
  const onSelectMapStyle = (mapStyle: string) => {
    log.debug('SettingsPanel onSelectMapStyle', mapStyle);
    dispatch(newAction(AppAction.setAppOption, { mapStyle }));
  }
  const onSetMapOpacity = (mapOpacity: number) => {
    dispatch(newAction(AppAction.setAppOption, { mapOpacity }));
  }
  const dispatchers = {
    onSelectMapStyle,
    onSetMapOpacity,
  }
  return dispatchers;
}

const SettingsPanelContainer = connect<SettingsPanelStateProps, SettingsPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(SettingsPanel as any);

export default SettingsPanelContainer;
