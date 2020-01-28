import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, CenterMapParams, newAction } from 'lib/actions';
import constants from 'lib/constants';
import { AppState } from 'lib/state';
import StartMenu from 'presenters/StartMenu';
import {
  dynamicTimelineHeight
} from 'lib/selectors';
import log from 'shared/log';

interface StartMenuStateProps {
  height: number;
  open: boolean;
  timelineHeight: number;
  trackingActivity: boolean;
  width: number;
}

interface StartMenuDispatchProps {
  onDismiss: (event: GestureResponderEvent) => void;
  onSelectEndActivity: (event: GestureResponderEvent) => void;
  onSelectNewActivity: (event: GestureResponderEvent) => void;
}

export type StartMenuProps = StartMenuStateProps & StartMenuDispatchProps;

const mapStateToProps = (state: AppState): StartMenuStateProps => {
  return {
    height: constants.startMenu.height,
    open: state.flags.startMenuOpen,
    timelineHeight: dynamicTimelineHeight(state),
    trackingActivity: state.flags.trackingActivity,
    width: constants.startMenu.width,
  }
}

const mapDispatchToProps = (dispatch: Function): StartMenuDispatchProps => {
  const onDismiss = (event: GestureResponderEvent) => {
    log.debug('onDismiss');
    dispatch(newAction(AppAction.flagDisable, 'startMenuOpen'));
  }
  const onSelectEndActivity = (event: GestureResponderEvent) => {
    log.debug('onSelectEndActivity');
    dispatch(newAction(AppAction.flagDisable, 'startMenuOpen'));
    dispatch(newAction(AppAction.stopActivity));
  }
  const onSelectNewActivity = (event: GestureResponderEvent) => {
    log.debug('onSelectNewActivity');
    dispatch(newAction(AppAction.flagDisable, 'startMenuOpen'));
    dispatch(newAction(AppAction.startActivity));
    setTimeout(() => {
      dispatch(newAction(AppAction.centerMap, {
        center: [0, 0],
        option: 'relative',
        zoom: constants.map.default.zoomStartActivity,
      } as CenterMapParams))
    }, 0)
  }
  const dispatchers = {
    onDismiss,
    onSelectEndActivity,
    onSelectNewActivity,
  }
  return dispatchers;
}

const StartMenuContainer = connect<StartMenuStateProps, StartMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(StartMenu as any);

export default StartMenuContainer;
