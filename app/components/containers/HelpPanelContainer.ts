import {
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import { AppState } from 'lib/state';
import HelpPanel from 'presenters/HelpPanel';
import log from 'shared/log';

interface HelpPanelStateProps {
  labelsEnabled: boolean;
  open: boolean;
}

interface HelpPanelDispatchProps {
  onSetLabelsEnabled: (enabled: boolean) => void;
}

export type HelpPanelProps = HelpPanelStateProps & HelpPanelDispatchProps;

const mapStateToProps = (state: AppState): HelpPanelStateProps => {
  return {
    labelsEnabled: state.flags.labelsEnabled,
    open: state.flags.helpOpen,
  }
}

const mapDispatchToProps = (dispatch: Function): HelpPanelDispatchProps => {
  const onSetLabelsEnabled = (enabled: boolean) => {
    log.debug('HelpPanel onSetLabelsEnabled', enabled);
    dispatch(newAction(enabled ? AppAction.flagEnable : AppAction.flagDisable, 'labelsEnabled'));
  }
  const dispatchers = {
    onSetLabelsEnabled,
  }
  return dispatchers;
}

const HelpPanelContainer = connect<HelpPanelStateProps, HelpPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpPanel as any);

export default HelpPanelContainer;
