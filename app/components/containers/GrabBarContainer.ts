import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  getCachedPathInfo,
  showActivityDetailsRows,
  snapPositions,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import GrabBar from 'presenters/GrabBar';
import log from 'shared/log';

interface GrabBarStateProps {
  key: string;
  pressed: boolean;
  snap: number;
  snapBack: boolean;
  snapBackTo: number;
  snapIndex: number;
}

interface GrabBarDispatchProps {
  onMoved: (snap: number, snapIndex: number) => void;
  onPressed: () => void;
  onReleased: (snapIndex: number) => void;
}

export type GrabBarProps = GrabBarStateProps & GrabBarDispatchProps;

const snapPosition = (state: AppState) => (snapPositions()[state.options.grabBarSnapIndex || 0])
const snapBack = (snap: number) => (
  Math.min(snap, snapPositions()[constants.snapIndex.activityList])
)
const shouldSnapBack = (state: AppState) => (
  !showActivityDetailsRows(state) ||
  !state.options.selectedActivityId ||
  !getCachedPathInfo(state)
)
const snapIfNeeded = (state: AppState, snap: number) => (
  shouldSnapBack(state) ? snapBack(snap) : snap
)

const mapStateToProps = (state: AppState): GrabBarStateProps => {
  const snap = snapIfNeeded(state, snapPosition(state));
  // That is the same trick used with the mapOpacity slider to avoid redundant updates.
  return {
    key: snap.toString(),
    pressed: state.flags.grabBarPressed,
    snap,
    snapBack: shouldSnapBack(state),
    snapBackTo: snapBack(snap),
    snapIndex: state.options.grabBarSnapIndex,
  }
}

const mapDispatchToProps = (dispatch: Function): GrabBarDispatchProps => {
  const onMoved = (snap: number, snapIndex: number) => {
    log.debug('onMoved', snap, snapIndex);
    setTimeout(() => {
      dispatch(newAction(AppAction.setAppOption, {
        grabBarSnapIndexPreview: snapIndex,
      }))
    }, 0)
  }
  const onPressed = () => {
    log.debug('onPressed');
    setTimeout(() => {
      log.debug('onPressed timeout');
      dispatch(newAction(AppAction.flagEnable, 'grabBarPressed'));
    }, 0)
  }
  const onReleased = (snapIndex: number) => {
    log.debug('onReleased', snapIndex);
    setTimeout(() => {
      log.debug('onReleased timeout');
      dispatch(newAction(AppAction.flagDisable, 'grabBarPressed'));
      dispatch(newAction(AppAction.setAppOption, { // Snap! Now we set both.
        grabBarSnapIndex: snapIndex,
        grabBarSnapIndexPreview: snapIndex,
      }))
    }, 0)
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
