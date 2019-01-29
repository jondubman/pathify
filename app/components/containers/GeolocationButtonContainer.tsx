import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, reducerAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import { dynamicTimelineHeight } from 'lib/selectors';
import GeolocationButton from 'presenters/GeolocationButton';

interface StateProps {
  marginBottom: number,
  open: boolean,
}

interface DispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

const mapStateToProps = (state: AppState): StateProps => {
  return {
    marginBottom: dynamicTimelineHeight(state),
    open: state.ui.flags.geolocationControlOpen,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
    dispatch(newAction(reducerAction.UI_FLAG_TOGGLE, 'geolocationControlOpen'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const GeolocationButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationButton as any);

export default GeolocationButtonContainer;
