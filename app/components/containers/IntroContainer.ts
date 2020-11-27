import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';
import log from 'shared/log';

interface IntroStateProps {
  pageIndex: number;
}

interface IntroDispatchProps {
  onPressClose: () => void;
  onPressNext: () => void;
  pageChanged: (index: number) => void;
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
    pageIndex: state.options.introModePage,
  }
}

const mapDispatchToProps = (dispatch: Function): IntroDispatchProps => {
  const pageChanged = (index: number) => {
    log.debug('Intro pageChanged', index);
    setTimeout(() => {
      dispatch(newAction(AppAction.setAppOption, { introModePage: index }));
    }, 0)
  }
  const onPressClose = () => {
    log.info('Intro onPressClose');
    ReactNativeHaptic.generate('impactLight');
    setTimeout(() => {
      dispatch(newAction(AppAction.flagDisable, 'introMode'));
    }, 0)
  }
  const onPressNext = () => {
    log.info('Intro onPressNext');
  }
  const dispatchers = {
    onPressClose,
    onPressNext,
    pageChanged,
  }
  return dispatchers;
}

const IntroContainer = connect<IntroStateProps, IntroDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Intro as any);

export default IntroContainer;
