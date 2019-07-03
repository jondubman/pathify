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
  mode: number,
  open: boolean,
}

interface GeolocationButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type GeolocationButtonProps = GeolocationButtonStateProps & GeolocationButtonDispatchProps;

const mapStateToProps = (state: AppState): GeolocationButtonStateProps => {
  return {
    bottomOffset: constants.geolocationButton.bottomOffset,
    leftOffset: constants.geolocationButton.leftOffset,
    mode: state.options.geolocationModeId,
    open: state.ui.panels.geolocation.open,
  }
}

const mapDispatchToProps = (dispatch: Function): GeolocationButtonDispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
    dispatch(newAction(AppAction.togglePanelVisibility, 'geolocation'));
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
