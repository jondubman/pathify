import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';

interface IntroStateProps {
  page: number;
}

interface IntroDispatchProps {
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
    page: state.options.introModePage,
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
