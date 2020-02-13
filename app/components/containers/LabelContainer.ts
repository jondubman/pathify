import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Label from 'presenters/Label';

interface LabelStateProps {
  visible: boolean;
}

interface LabelDispatchProps {
}

export type LabelProps = LabelStateProps & LabelDispatchProps;

const mapStateToProps = (state: AppState): LabelStateProps => {
  return {
    visible: state.flags.labelsEnabled,
  }
}

const mapDispatchToProps = (dispatch: Function): LabelDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const LabelContainer = connect<LabelStateProps, LabelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Label as any);

export default LabelContainer;
