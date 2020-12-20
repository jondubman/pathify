import {
  Linking,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import constants from 'lib/constants';
import { AppState } from 'lib/state';
import HelpPanel from 'presenters/HelpPanel';
import log from 'shared/log';

interface HelpPanelStateProps {
  introLabel: string;
  labelsEnabled: boolean;
  open: boolean;
  version: string;
}

interface HelpPanelDispatchProps {
  onLinkPrivacy: () => void;
  onLinkWeb: () => void;
  onSelectIntro: () => void;
  onSetLabelsEnabled: (enabled: boolean) => void;
}

export type HelpPanelProps = HelpPanelStateProps & HelpPanelDispatchProps;

const mapStateToProps = (state: AppState): HelpPanelStateProps => {
  const { appBuild, appVersion } = state.options;
  const { devMode, introMode, remoteDebug, testMode } = state.flags;
  let introLabel: string;
  if (introMode) {
    introLabel = 'Exit intro...';
  } else {
    introLabel = 'Review intro...';
  }
  const period = devMode || remoteDebug || testMode;
  return {
    introLabel,
    labelsEnabled: state.flags.labelsEnabled,
    open: state.flags.helpOpen,
    version: `Pathify v${appVersion}.${appBuild}${period ? '.' : ''}${__DEV__ ? 'dev' : ''}`,
  }
}

const mapDispatchToProps = (dispatch: Function): HelpPanelDispatchProps => {
  const onLinkPrivacy = () => {
    log.debug('HelpPanel onLinkPrivacy');
    Linking.openURL(constants.urls.privacyPolicy);
  }
  const onLinkWeb = () => {
    log.debug('HelpPanel onLinkWeb');
    Linking.openURL(constants.urls.pathifyWeb);
  }
  const onSelectIntro = () => {
    log.debug('HelpPanel onSelectIntro');
    ReactNativeHaptic.generate('impactLight');
    dispatch(newAction(AppAction.flagDisable, 'helpOpen'));
    dispatch(newAction(AppAction.flagToggle, 'introMode'));
  }
  const onSetLabelsEnabled = (enabled: boolean) => {
    log.debug('HelpPanel onSetLabelsEnabled', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'labelsEnabled'));
  }
  const dispatchers = {
    onLinkPrivacy,
    onLinkWeb,
    onSelectIntro,
    onSetLabelsEnabled,
  }
  return dispatchers;
}

const HelpPanelContainer = connect<HelpPanelStateProps, HelpPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpPanel as any);

export default HelpPanelContainer;
