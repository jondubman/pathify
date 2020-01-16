import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import constants from 'lib/constants';
import { AppState } from 'lib/state';
import ClockMenu from 'presenters/ClockMenu';
import log from 'shared/log';

interface ClockMenuStateProps {
  bottom: number;
  open: boolean;
}

interface ClockMenuDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type ClockMenuProps = ClockMenuStateProps & ClockMenuDispatchProps;

const mapStateToProps = (state: AppState): ClockMenuStateProps => {
  return {
    bottom: 0,
    open: state.flags.clockMenuOpen,
  }
}

const mapDispatchToProps = (dispatch: Function): ClockMenuDispatchProps => {
  const onPress = () => {
    log.debug('ClockMenu press');
    dispatch(newAction(AppAction.clockPress));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const ClockMenuContainer = connect<ClockMenuStateProps, ClockMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ClockMenu as any);

export default ClockMenuContainer;
