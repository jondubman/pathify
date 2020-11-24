import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';
import log from 'shared/log';

interface IntroStateProps {
  page: number;
}

interface IntroDispatchProps {
  pageChanged: (index: number) => void;
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
    page: state.options.introModePage,
  }
}

const mapDispatchToProps = (dispatch: Function): IntroDispatchProps => {
  const pageChanged = (index: number) => {
    log.debug('Intro pageChanged', index);
    dispatch(newAction(AppAction.setAppOption, { introModePage: index }));
  }
  const dispatchers = {
    pageChanged,
  }
  return dispatchers;
}

const IntroContainer = connect<IntroStateProps, IntroDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Intro as any);

export default IntroContainer;
