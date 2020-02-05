import {
  GestureResponderEvent,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import {
  dynamicLowerButtonBase,
  mapHidden,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import store from 'lib/store';

import FollowButtons from 'presenters/FollowButtons';

interface FollowButtonsStateProps {
  bottomOffset: number;
  followingPath: boolean;
  followingUser: boolean;
  hideBoth: boolean;
  hideFollowPath: boolean;
}

interface FollowButtonsDispatchProps {
  onPressFollowPath: (event: GestureResponderEvent) => void;
  onPressFollowUser: (event: GestureResponderEvent) => void;
}

export type FollowButtonsProps = FollowButtonsStateProps & FollowButtonsDispatchProps;

const mapStateToProps = (state: AppState): FollowButtonsStateProps => {
  const {
    followingPath,
    followingUser,
    mapFullScreen,
    timelineNow,
  } = state.flags;
  return {
    followingPath,
    followingUser,
    bottomOffset: dynamicLowerButtonBase(state),
    hideBoth: mapHidden(state),
    hideFollowPath: timelineNow && mapFullScreen && !followingPath,
  }
}

const mapDispatchToProps = (dispatch: Function): FollowButtonsDispatchProps => {
  const onPressFollowPath = () => {
    const {
      followingPath,
      mapFullScreen,
      timelineNow,
    } = store.getState().flags;
    if (followingPath) { // toggle the state
      dispatch(newAction(AppAction.stopFollowingPath));
    } else {
      dispatch(newAction(AppAction.startFollowingPath));
      if (!mapFullScreen && timelineNow) {
        dispatch(newAction(AppAction.jumpToBackTime)); // When engaging followPath, you probably want to see the path.
      }
    }
    ReactNativeHaptic.generate('impactLight');
  }
  const onPressFollowUser = () => {
    const {
      followingUser,
      mapFullScreen,
      timelineNow,
    } = store.getState().flags;
    if (followingUser) { // toggle the state
      dispatch(newAction(AppAction.stopFollowingUser));
    } else {
      dispatch(newAction(AppAction.startFollowingUser));
      if (!mapFullScreen && !timelineNow) {
        dispatch(newAction(AppAction.jumpToNow));
      }
      setTimeout(() => {
        dispatch(newAction(AppAction.centerMapOnUser));
      }, 0)
    }
    ReactNativeHaptic.generate('impactLight');
  }
  const dispatchers = {
    onPressFollowPath,
    onPressFollowUser,
  }
  return dispatchers;
}

const FollowButtonsContainer = connect<FollowButtonsStateProps, FollowButtonsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(FollowButtons) as any;

export default FollowButtonsContainer;
