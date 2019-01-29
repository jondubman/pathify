import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';
import { AppState } from 'lib/reducer';

interface StateProps {
  showTimeline: boolean;
}

interface DispatchProps {
}

const mapStateToProps = (state: AppState): StateProps => {
  return {
    showTimeline: !state.ui.flags.mapFullScreen,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const AppUIContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(AppUI as any);

export default AppUIContainer;
