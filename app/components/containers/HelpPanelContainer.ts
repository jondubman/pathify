import {
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import { AppState } from 'lib/state';
import HelpPanel from 'presenters/HelpPanel';
import log from 'shared/log';

interface HelpPanelStateProps {
  open: boolean;
  tipsEnabled: boolean;
}

interface HelpPanelDispatchProps {
  onSetTipsEnabled: (enabled: boolean) => void;
}

export type HelpPanelProps = HelpPanelStateProps & HelpPanelDispatchProps;

const mapStateToProps = (state: AppState): HelpPanelStateProps => {
  return {
    open: state.flags.helpOpen,
    tipsEnabled: state.flags.tipsEnabled,
  }
}

const mapDispatchToProps = (dispatch: Function): HelpPanelDispatchProps => {
  const onSetTipsEnabled = (enabled: boolean) => {
    log.debug('HelpPanel onSetTipsEnabled', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'tipsEnabled'));
  }
  const dispatchers = {
    onSetTipsEnabled,
  }
  return dispatchers;
}

const HelpPanelContainer = connect<HelpPanelStateProps, HelpPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpPanel as any);

export default HelpPanelContainer;
