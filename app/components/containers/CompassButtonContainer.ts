import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import {
  dynamicLowerButtonBase,
  mapHidden,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import log from 'shared/log';

import CompassButton from 'presenters/CompassButton';

interface CompassButtonStateProps {
  bottomOffset: number;
  heading: number | null;
  hidden: boolean;
  reorienting: boolean;
}

interface CompassButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type CompassButtonProps = CompassButtonStateProps & CompassButtonDispatchProps;

const mapStateToProps = (state: AppState): CompassButtonStateProps => {
  const heading = state.mapHeading || 0;
  const reorienting = state.flags.mapMoving && state.flags.mapReorienting;
  return {
    bottomOffset: dynamicLowerButtonBase(state),
    heading,
    hidden: mapHidden(state),
    reorienting,
  }
}

const mapDispatchToProps = (dispatch: Function): CompassButtonDispatchProps => {
  const onPress = () => {
    log.debug('compass press');
    dispatch(newAction(AppAction.reorientMap));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const CompassButtonContainer = connect<CompassButtonStateProps, CompassButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(CompassButton as any);

export default CompassButtonContainer;
