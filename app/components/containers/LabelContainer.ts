import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Label from 'presenters/Label';

interface LabelStateProps {
  alwaysShow: boolean;
  // TODO this might be part of solving TS error 2741 below
  // children?: React.ReactNode;
  visible: boolean;
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
    visible: state.flags.labelsEnabled,
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
)(Label) as any; // TODO "as any" is not ideal but otherwise getting TS error 2741 which seems to be a rabbit hole

export default LabelContainer;
