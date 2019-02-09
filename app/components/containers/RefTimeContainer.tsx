import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import RefTime from 'presenters/RefTime';

interface RefTimeStateProps {
}

interface RefTimeDispatchProps {
}

export type RefTimeProps = RefTimeStateProps & RefTimeDispatchProps;

const mapStateToProps = (state: AppState): RefTimeStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): RefTimeDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const RefTimeContainer = connect<RefTimeStateProps, RefTimeDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(RefTime as any);

export default RefTimeContainer;
