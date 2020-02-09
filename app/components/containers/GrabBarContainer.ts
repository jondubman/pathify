import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import { AppState } from 'lib/state';
import GrabBar from 'presenters/GrabBar';

interface GrabBarStateProps {
  pressed: boolean;
  snap: number;
}

interface GrabBarDispatchProps {
  onMoved: (snap: number) => void;
  onPressed: () => void;
  onReleased: (snap: number) => void;
}

export type GrabBarProps = GrabBarStateProps & GrabBarDispatchProps;

const mapStateToProps = (state: AppState): GrabBarStateProps => {
  return {
    pressed: state.flags.grabBarPressed,
    snap: state.options.grabBarSnap, // not grabBarSnapPreview! That changes while dragging.
  } // This is the same trick used with the mapOpacity slider to avoid redundant updates.
}

const mapDispatchToProps = (dispatch: Function): GrabBarDispatchProps => {
  const onMoved = (snap: number) => {
    dispatch(newAction(AppAction.setAppOption, {
     // grabBarSnap no touch! only set preview. See mapStateToProps.
     grabBarSnapPreview: snap,
    }))
  }
  const onPressed = () => {
    dispatch(newAction(AppAction.flagEnable, 'grabBarPressed'));
  }
  const onReleased = (snap: number) => {
    dispatch(newAction(AppAction.flagDisable, 'grabBarPressed'));
    dispatch(newAction(AppAction.setAppOption, { // Snap! Now we set both.
      grabBarSnap: snap,
      grabBarSnapPreview: snap,
    }))
  }
  const dispatchers = {
    onMoved,
    onPressed,
    onReleased,
  }
  return dispatchers;
}

const GrabBarContainer = connect<GrabBarStateProps, GrabBarDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GrabBar as any);

export default GrabBarContainer;
