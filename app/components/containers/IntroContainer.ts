import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import Intro from 'presenters/Intro';
import log from 'shared/log';

interface IntroStateProps {
  pageIndex: number;
  requestedLocationPermission: boolean;
}

interface IntroDispatchProps {
  onPressClose: () => void;
  pageChanged: (index: number) => void;
  requestLocationPermission: (onDone: Function) => void;
}

export type IntroProps = IntroStateProps & IntroDispatchProps;

const mapStateToProps = (state: AppState): IntroStateProps => {
  return {
    pageIndex: state.options.introModePage,
    requestedLocationPermission: state.flags.requestedLocationPermission,
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
    dispatch(newAction(AppAction.flagDisable, 'introMode'));
    ReactNativeHaptic.generate('impactLight');
  }
  const requestLocationPermission = (onDone: Function) => {
    log.info('Intro requestLocationPermission');
    dispatch(newAction(AppAction.requestLocationPermission, { onDone }));
  }
  const dispatchers = {
    onPressClose,
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
