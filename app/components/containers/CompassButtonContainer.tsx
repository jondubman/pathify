import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/reducer';

import CompassButton from 'presenters/CompassButton';

interface StateProps {
  heading: number | null;
  mapMoving: boolean;
}

interface DispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

// interface OwnProps {
// }

const mapStateToProps = (state: AppState /* , ownProps: OwnProps */): StateProps => {
  let heading = null;
  if (state.mapRegion) {
    const r = state.mapRegion;
    heading = r.properties!.heading;
  }
  return {
    heading,
    mapMoving: state.ui.flags.mapMoving,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('compass press');
    dispatch(newAction(appAction.REORIENT_MAP));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const CompassButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any, // TODO 'as any' addresses TS error 2345
  mapDispatchToProps
)(CompassButton as any); // TODO 'as any' addresses TS error 2345

export default CompassButtonContainer;
