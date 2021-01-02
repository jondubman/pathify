import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  getCachedPathInfo,
  listedActivities,
  showActivityDetailsRows,
  snapPositions,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import GrabBar from 'presenters/GrabBar';
import log from 'shared/log';

interface GrabBarStateProps {
  activityCount: number;
  activitySelected: boolean;
  introMode: boolean;
  keyName: string;
  labelsEnabled: boolean;
  pressed: boolean;
  snap: number;
  snapBack: boolean;
  snapBackTo: number;
  snapIndex: number;
  snapPositions: number[];
  topMenuOpen: boolean;
}

interface GrabBarDispatchProps {
  onMoved: (snap: number, snapIndex: number) => void;
  onPressed: () => void;
  onReleased: (snapIndex: number) => void;
}

export type GrabBarProps = GrabBarStateProps & GrabBarDispatchProps;

const snapPosition = (state: AppState) => (snapPositions(state)[state.options.grabBarSnapIndex || 0])
const snapBack = (state: AppState, snap: number) => (
  state.flags.introMode ?
    snap
    :
    Math.min(snap, snapPositions(state)[constants.snapIndex.activityList])
)

// GrabBar "snaps back" up if you drag it down to show details when there are none to show...
// But should that change, details are shown -- the user's preference is remembered.
const shouldSnapBack = (state: AppState) => (
  !showActivityDetailsRows(state) ||
  !state.options.selectedActivityId ||
  !getCachedPathInfo(state) ||
  state.flags.topMenuOpen
)
const snapIfNeeded = (state: AppState, snap: number) => (
  shouldSnapBack(state) ? snapBack(state, snap) : snap
)

const mapStateToProps = (state: AppState): GrabBarStateProps => {
  const snap = snapIfNeeded(state, snapPosition(state));
  const { introMode } = state.flags;
  // That is the same trick used with the mapOpacity slider to avoid redundant updates.
  return {
    activityCount: listedActivities(state).length || 0,
    activitySelected: !!state.options.selectedActivityId,
    introMode,
    keyName: `${introMode}:${snapPositions.toString()}`,
    labelsEnabled: state.flags.labelsEnabled,
    pressed: state.flags.grabBarPressed,
    snap, // number
    snapBack: shouldSnapBack(state),
    snapBackTo: snapBack(state, snap),
    snapIndex: Math.min(state.options.grabBarSnapIndex, snapPositions(state).length - 1),
    snapPositions: snapPositions(state),
    topMenuOpen: state.flags.topMenuOpen,
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
