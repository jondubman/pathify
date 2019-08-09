import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicLowerButtonBase } from 'lib/selectors';
import { AppState } from 'lib/state';
import GeolocationButton from 'presenters/GeolocationButton';
import log from 'shared/log';

interface GeolocationButtonStateProps {
  bottomOffset: number,
  enabled: boolean,
}

interface GeolocationButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type GeolocationButtonProps = GeolocationButtonStateProps & GeolocationButtonDispatchProps;

const mapStateToProps = (state: AppState): GeolocationButtonStateProps => {
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    enabled: state.flags.backgroundGeolocation,
  }
}

const mapDispatchToProps = (dispatch: Function): GeolocationButtonDispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
    dispatch(newAction(AppAction.startStopActivity));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const GeolocationButtonContainer = connect<GeolocationButtonStateProps, GeolocationButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationButton as any);

export default GeolocationButtonContainer;
