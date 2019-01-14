import { connect } from 'react-redux';

import {
  appAction,
  newAction,
} from 'lib/actions';

import { AppState } from 'lib/reducer';
import store from 'lib/store';

import FollowMeButton from 'presenters/FollowMeButton';

interface StateProps {
  active: boolean;
}

interface DispatchProps {
  onPress: Function;
}

// interface OwnProps {
// }

const mapStateToProps = (state: AppState /* , ownProps: OwnProps */): StateProps => {
  return {
    active: state.options.followingUser,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    const { followingUser } = store.options();
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

const FollowMeButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any, // TODO 'as any' addresses TS error 2345
  mapDispatchToProps
)(FollowMeButton as any); // TODO 'as any' addresses TS error 2345

export default FollowMeButtonContainer;
