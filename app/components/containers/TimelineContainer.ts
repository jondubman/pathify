import { connect } from 'react-redux';

import Timeline from 'presenters/Timeline';

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
)(Timeline as any); // TODO 'as any' addresses TS error 2345

export default AppUIContainer;
