import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, CenterMapParams, newAction } from 'lib/actions';
import constants from 'lib/constants';
import { dynamicLowerButtonBase } from 'lib/selectors';
import { AppState } from 'lib/state';
import store from 'lib/store';
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
    dispatch(newAction(AppAction.flagToggle, 'backgroundGeolocation'));
    if (store.getState().flags.backgroundGeolocation) { // if enabled now
      dispatch(newAction(AppAction.startFollowingUser));
      dispatch(newAction(AppAction.centerMap, {
        center: [0, 0],
        option: 'relative',
        zoom: constants.map.default.zoom + 1, // TODO
      } as CenterMapParams));
    }
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
