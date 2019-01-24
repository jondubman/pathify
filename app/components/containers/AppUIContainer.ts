import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';

interface StateProps {
}

interface DispatchProps {
}

const mapStateToProps = (state: any): StateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const AppUIContainer = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(AppUI as any);

export default AppUIContainer;
