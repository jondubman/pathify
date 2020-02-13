import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Tip from 'presenters/Label';

interface TipStateProps {
  visible: boolean;
}

interface TipDispatchProps {
}

export type TipProps = TipStateProps & TipDispatchProps;

const mapStateToProps = (state: AppState): TipStateProps => {
  return {
    visible: state.flags.labelsEnabled,
  }
}

const mapDispatchToProps = (dispatch: Function): TipDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const LabelContainer = connect<TipStateProps, TipDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Tip as any);

export default LabelContainer;
