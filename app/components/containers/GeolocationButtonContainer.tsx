import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import constants from 'lib/constants';
import { AppState } from 'lib/state';
import GeolocationButton from 'presenters/GeolocationButton';
import log from 'shared/log';

interface GeolocationButtonStateProps {
  bottomOffset: number,
  leftOffset: number,
  enabled: boolean,
}

interface GeolocationButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type GeolocationButtonProps = GeolocationButtonStateProps & GeolocationButtonDispatchProps;

const mapStateToProps = (state: AppState): GeolocationButtonStateProps => {
  return {
    bottomOffset: constants.geolocationButton.bottomOffset,
    leftOffset: constants.geolocationButton.leftOffset,
    enabled: state.flags.backgroundGeolocation,
  }
}

const mapDispatchToProps = (dispatch: Function): GeolocationButtonDispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
    dispatch(newAction(AppAction.uiFlagToggle, 'backgroundGeolocation'));
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
