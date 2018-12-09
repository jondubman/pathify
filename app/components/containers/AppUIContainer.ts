import { connect } from 'react-redux';

import AppUI from 'presenters/AppUI';

const mapStateToProps = (state: any) => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any) => {
  const dispatchers = {
  }
  return dispatchers;
}

const AppUIContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AppUI);

export default AppUIContainer;
