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
  active: boolean;
  bottomOffset: number;
  hidden: boolean;
}

interface FollowButtonsDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type FollowButtonsProps = FollowButtonsStateProps & FollowButtonsDispatchProps;

const mapStateToProps = (state: AppState): FollowButtonsStateProps => {
  return {
    active: state.flags.followingUser,
    bottomOffset: dynamicLowerButtonBase(state),
    hidden: mapHidden(state),
  }
}

const mapDispatchToProps = (dispatch: Function): FollowButtonsDispatchProps => {
  const onPress = () => {
    const { followingUser } = store.getState().flags;
    if (followingUser) { // toggle the state
      dispatch(newAction(AppAction.stopFollowingUser));
    } else {
      dispatch(newAction(AppAction.startFollowingUser));
    }
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const FollowButtonsContainer = connect<FollowButtonsStateProps, FollowButtonsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(FollowButtons as any);

export default FollowButtonsContainer;
