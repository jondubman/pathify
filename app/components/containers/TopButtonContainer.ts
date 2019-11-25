import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicAreaTop } from 'lib/selectors';
import { AppState } from 'lib/state';
import TopButton from 'presenters/TopButton';
import log from 'shared/log';

interface TopButtonStateProps {
  enabled: boolean;
  topOffset: number;
  visible: boolean;
}

interface TopButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type TopButtonProps = TopButtonStateProps & TopButtonDispatchProps;

const mapStateToProps = (state: AppState): TopButtonStateProps => {
  return {
    enabled: state.flags.topMenuOpen,
    topOffset: dynamicAreaTop(state),
    visible: !(state.flags.settingsOpen || state.flags.helpOpen),
  }
}

const mapDispatchToProps = (dispatch: Function): TopButtonDispatchProps => {
  const onPress = () => {
    log.debug('TopButton press');
    dispatch(newAction(AppAction.closePanels, { option: 'otherThanTopMenu' }));
    dispatch(newAction(AppAction.flagToggle, 'topMenuOpen'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const TopButtonContainer = connect<TopButtonStateProps, TopButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TopButton as any);

export default TopButtonContainer;
