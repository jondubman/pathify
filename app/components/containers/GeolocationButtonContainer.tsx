import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import { dynamicTimelineHeight } from 'lib/selectors';
import GeolocationButton from 'presenters/GeolocationButton';

interface GeolocationButtonStateProps {
  marginBottom: number,
  open: boolean,
}

interface GeolocationButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type GeolocationButtonProps = GeolocationButtonStateProps & GeolocationButtonDispatchProps;

const mapStateToProps = (state: AppState): GeolocationButtonStateProps => {
  return {
    marginBottom: dynamicTimelineHeight(state),
    open: state.ui.flags.geolocationControlOpen,
  }
}

const mapDispatchToProps = (dispatch: any): GeolocationButtonDispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
    dispatch(newAction(reducerAction.UI_FLAG_TOGGLE, 'geolocationControlOpen'));
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
