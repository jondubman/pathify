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

import FollowMeButton from 'presenters/FollowMeButton';

interface FollowMeButtonStateProps {
  active: boolean;
  bottomOffset: number;
  hidden: boolean;
}

interface FollowMeButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type FollowMeButtonProps = FollowMeButtonStateProps & FollowMeButtonDispatchProps;

const mapStateToProps = (state: AppState): FollowMeButtonStateProps => {
  return {
    active: state.flags.followingUser,
    bottomOffset: dynamicLowerButtonBase(state),
    hidden: mapHidden(state),
  }
}

const mapDispatchToProps = (dispatch: Function): FollowMeButtonDispatchProps => {
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

const FollowMeButtonContainer = connect<FollowMeButtonStateProps, FollowMeButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(FollowMeButton as any);

export default FollowMeButtonContainer;