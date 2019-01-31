import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import { AppState } from 'lib/reducer';
import {
  dynamicTimelineHeight,
  mapHidden,
} from 'lib/selectors';
import store from 'lib/store';

import FollowMeButton from 'presenters/FollowMeButton';

interface FollowMeButtonStateProps {
  active: boolean;
  hidden: boolean;
  marginBottom: number;
}

interface FollowMeButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type FollowMeButtonProps = FollowMeButtonStateProps & FollowMeButtonDispatchProps;

const mapStateToProps = (state: AppState /* , ownProps: OwnProps */): FollowMeButtonStateProps => {
  return {
    active: state.ui.flags.followingUser,
    hidden: mapHidden(state),
    marginBottom: dynamicTimelineHeight(state),
  }
}

const mapDispatchToProps = (dispatch: any): FollowMeButtonDispatchProps => {
  const onPress = () => {
    const { followingUser } = store.uiState().flags;
    if (followingUser) { // toggle the state
      dispatch(newAction(appAction.STOP_FOLLOWING_USER));
    } else {
      dispatch(newAction(appAction.START_FOLLOWING_USER));
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
