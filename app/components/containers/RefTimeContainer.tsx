import { connect } from 'react-redux';

import { dynamicTimelineHeight } from 'lib/selectors';
import { AppState } from 'lib/state';
import RefTime from 'presenters/RefTime';
import constants from 'lib/constants';

interface RefTimeStateProps {
  bottom: number;
  refTime: number;
}

interface RefTimeDispatchProps {
}

export type RefTimeProps = RefTimeStateProps & RefTimeDispatchProps;

const mapStateToProps = (state: AppState): RefTimeStateProps => {
  return {
    bottom: dynamicTimelineHeight(state) + constants.refTime.bottomMargin,
    refTime: state.refTime,
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
