import {
  GestureResponderEvent,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import {
  activityIndex,
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import store from 'lib/store';
import TopButton from 'presenters/TopButton';
import log from 'shared/log';

interface TopButtonStateProps {
  activityCount: string;
  activityId: string;
  current: boolean;
  enabled: boolean;
  selected: boolean;
  topOffset: number;
  visible: boolean;
}

interface TopButtonDispatchProps {
  onPressIn: (event: GestureResponderEvent) => void;
}

export type TopButtonProps = TopButtonStateProps & TopButtonDispatchProps;

const mapStateToProps = (state: AppState): TopButtonStateProps => {
  const {
    helpOpen,
    settingsOpen,
    topMenuOpen,
  } = state.flags;
  const {
    currentActivityId,
    selectedActivityId,
  } = state.options;
  return {
    activityCount: activityIndex(state).toString(),
    activityId: selectedActivityId || '',
    current: !!(currentActivityId && currentActivityId === selectedActivityId),
    enabled: topMenuOpen,
    selected: state.options.selectedActivityId !== null,
    topOffset: dynamicAreaTop(),
    visible: !(settingsOpen || helpOpen),
  }
}

const mapDispatchToProps = (dispatch: Function): TopButtonDispatchProps => {
  const onPressIn = () => {
    log.debug('TopButton onPressIn');
    ReactNativeHaptic.generate('impactLight');
    const state = store.getState();
    const { selectedActivityId } = state.options;
    // TODO for now, no actual menu opens unless there is a selected activity, because it would serve no purpose.
    if (selectedActivityId !== null) {
      dispatch(newAction(AppAction.closePanels, { option: 'otherThanTopMenu' }));
      dispatch(newAction(AppAction.flagToggle, 'topMenuOpen'));
    }
  }
  const dispatchers = {
    onPressIn,
  }
  return dispatchers;
}

const TopButtonContainer = connect<TopButtonStateProps, TopButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TopButton as any);

export default TopButtonContainer;
