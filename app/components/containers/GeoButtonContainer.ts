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
  onPress: (event: GestureResponderEvent) => void;
}

export type GeoButtonProps = GeoButtonStateProps & GeoButtonDispatchProps;

const mapStateToProps = (state: AppState): GeoButtonStateProps => {
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    enabled: state.flags.trackingActivity,
  }
}

const mapDispatchToProps = (dispatch: Function): GeoButtonDispatchProps => {
  const onPress = () => {
    log.debug('GeoButton press');
    dispatch(newAction(AppAction.startOrStopActivity));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const GeoButtonContainer = connect<GeoButtonStateProps, GeoButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeoButton as any);

export default GeoButtonContainer;
