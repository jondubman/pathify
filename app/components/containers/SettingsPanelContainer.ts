import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import constants, { MapStyle } from 'lib/constants';
import {
  dynamicAreaTop,
  dynamicMapStyle,
  mapStyles,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import SettingsPanel from 'presenters/SettingsPanel';
import log from 'shared/log';

interface SettingsPanelStateProps {
  colorizeActivities: boolean;
  mapOpacity: number;
  mapStyle: MapStyle;
  mapStyles: MapStyle[];
  open: boolean;
  showAllPastLocations: boolean;
  showSequentialPaths: boolean;
  topOffset: number;
}

interface SettingsPanelDispatchProps {
  onSelectMapStyle: (name: string) => void;
  onSetColorizeActivites: (enabled: boolean) => void;
  onSetShowSequentialPaths: (enabled: boolean) => void;
  onSetMapOpacity: (opacity: number) => void;
  onSetMapOpacityPreview: (opacity: number) => void;
}

export type SettingsPanelProps = SettingsPanelStateProps & SettingsPanelDispatchProps;

const mapStateToProps = (state: AppState): SettingsPanelStateProps => {
  return {
    colorizeActivities: state.flags.colorizeActivities,
    mapOpacity: state.options.mapOpacity, // note: not using state.options.mapOpacityPreview, to avoid stuttering slider
    mapStyle: dynamicMapStyle(state),
    mapStyles: mapStyles(state),
    open: state.flags.settingsOpen,
    showAllPastLocations: state.flags.showAllPastLocations,
    showSequentialPaths: state.flags.showSequentialPaths,
    topOffset: dynamicAreaTop(),
  }
}

const mapDispatchToProps = (dispatch: Function): SettingsPanelDispatchProps => {
  const onSelectMapStyle = (mapStyle: string) => {
    log.debug('SettingsPanel onSelectMapStyle', mapStyle);
    dispatch(newAction(AppAction.setAppOption, { mapStyle }));
  }
  const onSetColorizeActivites = (enabled: boolean) => {
    log.debug('SettingsPanel onSetColorizeActivites', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'colorizeActivities'));
  }
  const onSetShowSequentialPaths = (enabled: boolean) => {
    log.debug('SettingsPanel onSetShowSequentialPaths', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'showSequentialPaths'));
  }
  // Unlike full screen switch, the Settings panel stays open while adjusting the opacity, style settings.
  const onSetMapOpacity = (mapOpacity: number) => {
    dispatch(newAction(AppAction.setAppOption, { mapOpacity, mapOpacityPreview: mapOpacity })); // set both
  }
  const onSetMapOpacityPreview = (mapOpacityPreview: number) => {
    dispatch(newAction(AppAction.setAppOptionASAP, { mapOpacityPreview })); // ASAP really speeds things up here
  }
  const dispatchers = {
    onSelectMapStyle,
    onSetColorizeActivites,
    onSetShowSequentialPaths,
    onSetMapOpacity,
    onSetMapOpacityPreview,
  }
  return dispatchers;
}

const SettingsPanelContainer = connect<SettingsPanelStateProps, SettingsPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(SettingsPanel as any);

export default SettingsPanelContainer;
