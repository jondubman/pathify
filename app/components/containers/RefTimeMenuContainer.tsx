import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import RefTimeMenu from 'presenters/RefTimeMenu';

interface RefTimeMenuStateProps {
}

interface RefTimeMenuDispatchProps {
}

export type RefTimeMenuProps = RefTimeMenuStateProps & RefTimeMenuDispatchProps;

const mapStateToProps = (state: AppState): RefTimeMenuStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): RefTimeMenuDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const RefTimeMenuContainer = connect<RefTimeMenuStateProps, RefTimeMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(RefTimeMenu as any);

export default RefTimeMenuContainer;
