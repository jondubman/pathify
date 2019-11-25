import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import { AppState } from 'lib/state';
import TopMenu from 'presenters/TopMenu';
import log from 'shared/log';

interface TopMenuStateProps {
  open: boolean;
}

interface TopMenuDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type TopMenuProps = TopMenuStateProps & TopMenuDispatchProps;

const mapStateToProps = (state: AppState): TopMenuStateProps => {
  return {
    open: state.flags.topMenuOpen,
  }
}

const mapDispatchToProps = (dispatch: Function): TopMenuDispatchProps => {
  const onPress = () => {
    log.debug('HelpButton press');
    dispatch(newAction(AppAction.closePanels, { option: 'otherThanHelp' }));
    dispatch(newAction(AppAction.flagToggle, 'helpOpen'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const TopMenuContainer = connect<TopMenuStateProps, TopMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TopMenu as any);

export default TopMenuContainer;
