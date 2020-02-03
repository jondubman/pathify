import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { newAction, AppAction } from 'lib/actions';
import constants from 'lib/constants';
import {
  dynamicTimelineHeight,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import TopMenu from 'presenters/TopMenu';
import log from 'shared/log';

interface TopMenuStateProps {
  current: boolean;
  height: number;
  open: boolean;
  selectedActivityId: string | null;
  showActivityDetails: boolean;
  timelineHeight: number;
  width: number;
}

interface TopMenuDispatchProps {
  // Note onDeleteActivity is a function that returns a function.
  onDeleteActivity: (id: string) => ((event: GestureResponderEvent) => void);
  onDismiss: (event: GestureResponderEvent) => void;
  onHideActivityDetails: (event: GestureResponderEvent) => void;
  onShowActivityDetails: (event: GestureResponderEvent) => void;
}

export type TopMenuProps = TopMenuStateProps & TopMenuDispatchProps;

const mapStateToProps = (state: AppState): TopMenuStateProps => {
  const {
    currentActivityId,
    selectedActivityId
  } = state.options;
  return {
    current: !!(currentActivityId && currentActivityId === selectedActivityId),
    height: constants.topMenu.height,
    open: state.flags.topMenuOpen,
    selectedActivityId,
    showActivityDetails: state.flags.showActivityDetails,
    timelineHeight: dynamicTimelineHeight(state),
    width: constants.topMenu.width,
  }
}

const mapDispatchToProps = (dispatch: Function): TopMenuDispatchProps => {
  const onDeleteActivity = (id: string) => ((event: GestureResponderEvent) => { // Note this returns a function.
    log.debug('TopMenu onDeleteActivity');
    dispatch(newAction(AppAction.flagDisable, 'topMenuOpen'));
    dispatch(newAction(AppAction.deleteActivity, { id }));
  })
  const onDismiss = (event: GestureResponderEvent) => {
    log.debug('TopMenu onDismiss');
    dispatch(newAction(AppAction.flagDisable, 'topMenuOpen'));
  }
  const onHideActivityDetails = () => {
    log.debug('TopMenu onHideActivityDetails');
    dispatch(newAction(AppAction.flagDisable, 'showActivityDetails'));
    dispatch(newAction(AppAction.flagDisable, 'topMenuOpen'));
  }
  const onShowActivityDetails = () => {
    log.debug('TopMenu onShowActivityDetails');
    dispatch(newAction(AppAction.flagEnable, 'showActivityDetails'));
    dispatch(newAction(AppAction.flagDisable, 'topMenuOpen'));
  }
  const dispatchers = {
    onDeleteActivity,
    onDismiss,
    onHideActivityDetails,
    onShowActivityDetails,
  }
  return dispatchers;
}

const TopMenuContainer = connect<TopMenuStateProps, TopMenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TopMenu as any);

export default TopMenuContainer;
