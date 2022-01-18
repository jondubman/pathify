import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Label from 'presenters/Label';

interface LabelStateProps {
  alwaysShow: boolean;
  labelsEnbled: boolean;
}

interface LabelDispatchProps {
}

interface OwnProps {
  alwaysShow?: boolean;
}

export type LabelProps = LabelStateProps & LabelDispatchProps;

const mapStateToProps = (state: AppState, ownProps?: OwnProps): LabelStateProps => {
  return {
    alwaysShow: !!(ownProps && ownProps.alwaysShow),
    labelsEnbled: state.flags.labelsEnabled,
  }
}

const mapDispatchToProps = (dispatch: Function): LabelDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const LabelContainer = connect<LabelStateProps, LabelDispatchProps, OwnProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Label);

export default LabelContainer;
