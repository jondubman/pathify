import {
  Linking,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import constants from 'lib/constants';
import { AppState } from 'lib/state';
import HelpPanel from 'presenters/HelpPanel';
import log from 'shared/log';

interface HelpPanelStateProps {
  version: string;
  labelsEnabled: boolean;
  open: boolean;
}

interface HelpPanelDispatchProps {
  onLinkPrivacy: () => void;
  onLinkWeb: () => void;
  onReplayIntro: () => void;
  onSetLabelsEnabled: (enabled: boolean) => void;
}

export type HelpPanelProps = HelpPanelStateProps & HelpPanelDispatchProps;

const mapStateToProps = (state: AppState): HelpPanelStateProps => {
  const { appBuild, appVersion } = state.options;
  const { devMode, remoteDebug } = state.flags;
  return {
    version: `Pathify v${appVersion}.${appBuild}${(devMode || remoteDebug) ? '.' : ''}${devMode ? 'dev' : ''}`,
    labelsEnabled: state.flags.labelsEnabled,
    open: state.flags.helpOpen,
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
  const onReplayIntro = () => {
    log.debug('HelpPanel onReplayIntro');
    dispatch(newAction(AppAction.flagDisable, 'helpOpen'));
    dispatch(newAction(AppAction.flagEnable, 'introMode'));
  }
  const onSetLabelsEnabled = (enabled: boolean) => {
    log.debug('HelpPanel onSetLabelsEnabled', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'labelsEnabled'));
  }
  const dispatchers = {
    onLinkPrivacy,
    onLinkWeb,
    onReplayIntro,
    onSetLabelsEnabled,
  }
  return dispatchers;
}

const HelpPanelContainer = connect<HelpPanelStateProps, HelpPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpPanel as any);

export default HelpPanelContainer;
