import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { MapStyle } from 'lib/constants';
import {
  dynamicMapStyle,
  mapStyles,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import SettingsPanel from 'presenters/SettingsPanel';
import log from 'shared/log';

interface SettingsPanelStateProps {
  open: boolean;
  mapFullScreen: boolean;
  mapOpacity: number;
  mapStyle: MapStyle;
  mapStyles: MapStyle[];
}

interface SettingsPanelDispatchProps {
  onSelectMapStyle: (name: string) => void;
  onSetMapOpacity: (opacity: number) => void;
  onSetMapOpacityPreview: (opacity: number) => void;
  onSetMapFullScreen: (value: boolean) => void;
}

export type SettingsPanelProps = SettingsPanelStateProps & SettingsPanelDispatchProps;

const mapStateToProps = (state: AppState): SettingsPanelStateProps => {
  return {
    open: state.flags.settingsOpen,
    mapFullScreen: state.flags.mapFullScreen,
    mapOpacity: state.options.mapOpacity, // note: not using state.options.mapOpacityPreview, to avoid stuttering slider
    mapStyle: dynamicMapStyle(state),
    mapStyles: mapStyles(state),
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
  const onSetMapOpacityPreview = (mapOpacityPreview: number) => {
    dispatch(newAction(AppAction.setAppOptionASAP, { mapOpacityPreview })); // ASAP really speeds things up here
  }
  const onSetMapFullScreen = (value: boolean) => {
    log.debug('SettingsPanel onSetMapFullScreen', value);
    dispatch(newAction(value ? AppAction.flagEnable : AppAction.flagDisable, 'mapFullScreen'));
  }
  const dispatchers = {
    onSelectMapStyle,
    onSetMapOpacity,
    onSetMapOpacityPreview,
    onSetMapFullScreen,
  }
  return dispatchers;
}

const SettingsPanelContainer = connect<SettingsPanelStateProps, SettingsPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(SettingsPanel as any);

export default SettingsPanelContainer;
