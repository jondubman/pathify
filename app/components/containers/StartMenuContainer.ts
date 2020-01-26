import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import StartMenu from 'presenters/StartMenu';
import log from 'shared/log';

interface StartMenuStateProps {
  bottom: number;
  open: boolean;
}

interface StartMenuDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type StartMenuProps = StartMenuStateProps & StartMenuDispatchProps;

const mapStateToProps = (state: AppState): StartMenuStateProps => {
  return {
    bottom: 0,
    open: state.flags.startMenuOpen,
  }
}

const mapDispatchToProps = (dispatch: Function): StartMenuDispatchProps => {
  const onPress = () => {
    log.debug('StartMenu press');
    // yield put(newAction(AppAction.closePanels, { option: 'otherThanStartMenu' }));
    // // yield put(newAction(AppAction.flagToggle, 'startMenuOpen'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const StartMenuContainer = connect<StartMenuStateProps, StartMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(StartMenu as any);

export default StartMenuContainer;
