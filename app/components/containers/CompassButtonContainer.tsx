import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import {
  mapHidden,
} from 'lib/selectors';
import { AppState } from 'lib/state';

import CompassButton from 'presenters/CompassButton';

interface CompassButtonStateProps {
  heading: number | null;
  hidden: boolean;
  reorienting: boolean;
}

interface CompassButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type CompassButtonProps = CompassButtonStateProps & CompassButtonDispatchProps;

const mapStateToProps = (state: AppState): CompassButtonStateProps => {
  let heading = null;
  if (state.mapRegion) {
    const r = state.mapRegion;
    heading = r.properties!.heading;
  }
  const reorienting = state.ui.flags.mapMoving && state.ui.flags.mapReorienting;
  return {
    heading,
    hidden: mapHidden(state),
    reorienting,
  }
}

const mapDispatchToProps = (dispatch: Function): CompassButtonDispatchProps => {
  const onPress = () => {
    log.debug('compass press');
    dispatch(newAction(appAction.reorientMap));
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
