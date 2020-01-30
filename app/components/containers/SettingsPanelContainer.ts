import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import constants, { MapStyle } from 'lib/constants';
import {
  dynamicMapStyle,
  mapStyles,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import store from 'lib/store';
import SettingsPanel from 'presenters/SettingsPanel';
import log from 'shared/log';

interface SettingsPanelStateProps {
  open: boolean;
  mapOpacity: number;
  mapStyle: MapStyle;
  mapStyles: MapStyle[];
  showTimeline: boolean;
}

interface SettingsPanelDispatchProps {
  onSelectMapStyle: (name: string) => void;
  onSetMapOpacity: (opacity: number) => void;
  onSetMapOpacityPreview: (opacity: number) => void;
  onSetShowTimeline: (value: boolean) => void;
}

export type SettingsPanelProps = SettingsPanelStateProps & SettingsPanelDispatchProps;

const mapStateToProps = (state: AppState): SettingsPanelStateProps => {
  return {
    open: state.flags.settingsOpen,
    mapOpacity: state.options.mapOpacity, // note: not using state.options.mapOpacityPreview, to avoid stuttering slider
    mapStyle: dynamicMapStyle(state),
    mapStyles: mapStyles(state),
    showTimeline: !state.flags.mapFullScreen,
  }
}

const mapDispatchToProps = (dispatch: Function): SettingsPanelDispatchProps => {
  const onSelectMapStyle = (mapStyle: string) => {
    log.debug('SettingsPanel onSelectMapStyle', mapStyle);
    dispatch(newAction(AppAction.setAppOption, { mapStyle }));
  }
  // Unlike full screen switch, the Settings panel stays open while adjusting the opacity, style settings.
  const onSetMapOpacity = (mapOpacity: number) => {
    dispatch(newAction(AppAction.setAppOption, { mapOpacity }));
  }
  const onSetMapOpacityPreview = (mapOpacityPreview: number) => {
    dispatch(newAction(AppAction.setAppOptionASAP, { mapOpacityPreview })); // ASAP really speeds things up here
  }
  const onSetShowTimeline = (value: boolean) => {
    log.debug('SettingsPanel onSetShowTimeline', value);
    dispatch(newAction(value ? AppAction.flagDisable : AppAction.flagEnable, 'mapFullScreen'));
    dispatch(newAction(AppAction.flagDisable, 'mapTapped'));
    // Close this panel. User could re-open it with one tap. This is probably what is preferred now.
    // The whole point of full screening the map is to have less clutter on top... including this panel.
    const { flags } = store.getState();
    if (flags.closeSettingsAfterFullScreenSwitch) {
      setTimeout(() => {
        dispatch(newAction(AppAction.flagDisable, 'settingsOpen'));
      }, constants.timing.menuFade) // TODO animate the fade
    }
  }
  const dispatchers = {
    onSelectMapStyle,
    onSetMapOpacity,
    onSetMapOpacityPreview,
    onSetShowTimeline,
  }
  return dispatchers;
}

const SettingsPanelContainer = connect<SettingsPanelStateProps, SettingsPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(SettingsPanel as any);

export default SettingsPanelContainer;
