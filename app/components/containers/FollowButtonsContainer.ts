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
import store from 'lib/store';

import FollowButtons from 'presenters/FollowButtons';

interface FollowButtonsStateProps {
  bottomOffset: number;
  followingPath: boolean;
  followingUser: boolean;
  hideBoth: boolean;
}

interface FollowButtonsDispatchProps {
  onPressFollowPath: (event: GestureResponderEvent) => void;
  onPressFollowUser: (event: GestureResponderEvent) => void;
}

export type FollowButtonsProps = FollowButtonsStateProps & FollowButtonsDispatchProps;

const mapStateToProps = (state: AppState): FollowButtonsStateProps => {
  return {
    followingPath: state.flags.followingPath,
    followingUser: state.flags.followingUser,
    bottomOffset: dynamicLowerButtonBase(state),
    hideBoth: mapHidden(state),
  }
}

const mapDispatchToProps = (dispatch: Function): FollowButtonsDispatchProps => {
  const onPressFollowPath = () => {
    const { followingPath } = store.getState().flags;
    if (followingPath) { // toggle the state
      dispatch(newAction(AppAction.stopFollowingPath));
    } else {
      dispatch(newAction(AppAction.startFollowingPath));
    }
  }
  const onPressFollowUser = () => {
    const { followingUser } = store.getState().flags;
    if (followingUser) { // toggle the state
      dispatch(newAction(AppAction.stopFollowingUser));
    } else {
      dispatch(newAction(AppAction.startFollowingUser));

      // TODO center map right away
      // dispatch(newAction(AppAction.centerMap, {
      // })
    }
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
