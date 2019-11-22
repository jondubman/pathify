import {
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import { AppState } from 'lib/state';
import HelpPanel from 'presenters/HelpPanel';

interface HelpPanelStateProps {
  open: boolean;
}

interface HelpPanelDispatchProps {
}

export type HelpPanelProps = HelpPanelStateProps & HelpPanelDispatchProps;

const mapStateToProps = (state: AppState): HelpPanelStateProps => {
  return {
    open: state.flags.helpOpen,
  }
}

const mapDispatchToProps = (dispatch: Function): HelpPanelDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const HelpPanelContainer = connect<HelpPanelStateProps, HelpPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpPanel as any);

export default HelpPanelContainer;
