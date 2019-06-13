import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
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
  const onSelectMapStyle = (mapStyleName: string) => {
    log.debug('SettingsPanel onSelectMapStyle', mapStyleName);
    dispatch(newAction(appAction.setAppOption, { name: 'mapStyle', value: mapStyleName }));
  }
  const onSetMapOpacity = (opacity: number) => {
    dispatch(newAction(appAction.setAppOption, { name: 'mapOpacity', value: opacity }));
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
