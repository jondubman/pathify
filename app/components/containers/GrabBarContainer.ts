import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import {
  getCachedPathInfo,
  snapPositions,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import GrabBar from 'presenters/GrabBar';
import log from 'shared/log';

interface GrabBarStateProps {
  key: string;
  pressed: boolean;
  snap: number;
}

interface GrabBarDispatchProps {
  onMoved: (snap: number, snapIndex: number) => void;
  onPressed: () => void;
  onReleased: (snap: number, snapIndex: number) => void;
}

export type GrabBarProps = GrabBarStateProps & GrabBarDispatchProps;

const mapStateToProps = (state: AppState): GrabBarStateProps => {
  let snap = state.options.grabBarSnap; // not grabBarSnapPreview! That changes while dragging.
  // This is the same trick used with the mapOpacity slider to avoid redundant updates.
  if (!state.options.selectedActivityId || !getCachedPathInfo(state)) {
    const snaps = snapPositions();
    snap = Math.min(snap, snaps[2]); // TODO constants.layout.snapIndex...
  }
  return {
    key: snap.toString(),
    pressed: state.flags.grabBarPressed,
    snap,
  }
}

const mapDispatchToProps = (dispatch: Function): GrabBarDispatchProps => {
  const onMoved = (snap: number, snapIndex: number) => {
    dispatch(newAction(AppAction.setAppOption, {
     // grabBarSnap no touch! only set preview. See mapStateToProps.
     grabBarSnapIndex: snapIndex,
     grabBarSnapPreview: snap,
    }))
  }
  const onPressed = () => {
    dispatch(newAction(AppAction.flagEnable, 'grabBarPressed'));
  }
  const onReleased = (snap: number, snapIndex: number) => {
    dispatch(newAction(AppAction.flagDisable, 'grabBarPressed'));
    dispatch(newAction(AppAction.setAppOption, { // Snap! Now we set both.
      grabBarSnap: snap,
      grabBarSnapIndex: snapIndex,
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
