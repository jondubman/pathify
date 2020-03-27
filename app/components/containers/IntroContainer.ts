import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';

interface IntroStateProps {
}

interface IntroDispatchProps {
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): IntroDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const IntroContainer = connect<IntroStateProps, IntroDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Intro as any);

export default IntroContainer;
