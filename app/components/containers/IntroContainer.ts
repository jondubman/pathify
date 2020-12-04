import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import {
  introPages,
} from 'lib/intro';
import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';
import log from 'shared/log';

interface IntroStateProps {
  grabBarSnapIndexPreview: number;
  pageIndex: number;
  requestedLocationPermission: boolean;
}

interface IntroDispatchProps {
  onPressClose: () => void;
  onPressReset: () => void;
  pageChanged: (index: number) => void;
  requestLocationPermission: (onDone: Function) => void;
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
    grabBarSnapIndexPreview: state.options.grabBarSnapIndexPreview,
    pageIndex: state.options.introModePage,
    requestedLocationPermission: state.flags.requestedLocationPermission,
  }
}

const mapDispatchToProps = (dispatch: Function): IntroDispatchProps => {
  const pageChanged = (index: number) => {
    log.debug('Intro pageChanged', index);
    if (index < 0) {
      // TODO this can happen after you Reset to page 0 and then navigate from there... the relative indexes are off
      // consistently in subsequent calls to pageChanged due to what appears to be a Slider component bug.
      // This simple workaround seems sufficient.
      log.warn('Negative page index in Intro pageChanged');
      index = index + introPages.length - 1;
    }
    setTimeout(() => {
      dispatch(newAction(AppAction.setAppOption, { introModePage: index }));
    }, 0)
  }
  const onPressClose = () => {
    log.info('Intro onPressClose');
    dispatch(newAction(AppAction.flagDisable, 'introMode'));
    ReactNativeHaptic.generate('impactLight');
  }
  const onPressReset = () => {
    log.info('Intro onPressReset');
    dispatch(newAction(AppAction.setAppOption, { introModePage: 0 }));
  }
  const requestLocationPermission = (onDone: Function) => {
    log.info('Intro requestLocationPermission');
    dispatch(newAction(AppAction.requestLocationPermission, { onDone }));
  }
  const dispatchers = {
    onPressClose,
    onPressReset,
    pageChanged,
    requestLocationPermission,
  }
  return dispatchers;
}

const IntroContainer = connect<IntroStateProps, IntroDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Intro as any);

export default IntroContainer;
