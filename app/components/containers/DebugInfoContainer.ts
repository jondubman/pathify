import { connect } from 'react-redux';

import constants from 'lib/constants';
import {
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import DebugInfo from 'presenters/DebugInfo';

export interface DebugInfoStateProps {
  text: string;
  top: number;
}

export interface DebugInfoDispatchProps {
}

export type DebugInfoProps = DebugInfoStateProps & DebugInfoDispatchProps;

const mapStateToProps = (state: AppState): DebugInfoStateProps => {
  let text = '';
  return {
    text,
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
  }
}

const mapDispatchToProps = (dispatch: Function): DebugInfoDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const DebugInfoContainer = connect<DebugInfoStateProps, DebugInfoDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(DebugInfo as any);

export default DebugInfoContainer;
