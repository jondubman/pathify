import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import {
  mapHidden,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import store from 'lib/store';

import FollowMeButton from 'presenters/FollowMeButton';

interface FollowMeButtonStateProps {
  active: boolean;
  hidden: boolean;
}

interface FollowMeButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type FollowMeButtonProps = FollowMeButtonStateProps & FollowMeButtonDispatchProps;

const mapStateToProps = (state: AppState /* , ownProps: OwnProps */): FollowMeButtonStateProps => {
  return {
    active: state.ui.flags.followingUser,
    hidden: mapHidden(state),
  }
}

const mapDispatchToProps = (dispatch: Function): FollowMeButtonDispatchProps => {
  const onPress = () => {
    const { followingUser } = store.uiState().flags;
    if (followingUser) { // toggle the state
      dispatch(newAction(appAction.stopFollowingUser));
    } else {
      dispatch(newAction(appAction.startFollowingUser));
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
