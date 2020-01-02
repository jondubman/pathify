import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicLowerButtonBase } from 'lib/selectors';
import { AppState } from 'lib/state';
import GeoButton from 'presenters/GeoButton';
import log from 'shared/log';

interface GeoButtonStateProps {
  bottomOffset: number,
  enabled: boolean,
}

interface GeoButtonDispatchProps {
  onStart: (event: GestureResponderEvent) => void;
  onStop: (event: GestureResponderEvent) => void;
}

export type GeoButtonProps = GeoButtonStateProps & GeoButtonDispatchProps;

const mapStateToProps = (state: AppState): GeoButtonStateProps => {
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    enabled: state.flags.trackingActivity,
  }
}

const mapDispatchToProps = (dispatch: Function): GeoButtonDispatchProps => {
  const onStart = () => {
    log.debug('GeoButton press START');
    dispatch(newAction(AppAction.startActivity));
  }
  const onStop = () => {
    log.debug('GeoButton press STOP');
    dispatch(newAction(AppAction.stopActivity));
  }
  const dispatchers = {
    onStart,
    onStop,
  }
  return dispatchers;
}

const GeoButtonContainer = connect<GeoButtonStateProps, GeoButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeoButton as any);

export default GeoButtonContainer;
