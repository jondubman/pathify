import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  dynamicClockBottom,
  shouldShowTimeline,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import ZoomClock from 'presenters/ZoomClock';
import log from 'shared/log';

interface ZoomClockStateProps {
  activitySelected: boolean;
  allowZoom: boolean;
  bottom: number;
  followingPath: boolean;
  followingUser: boolean;
  labelsEnabled: boolean;
  nowMode: boolean;
  pressed: boolean;
}

interface ZoomClockDispatchProps {
  onBackSelected: () => void;
  onNowSelected: () => void;
  onPressed: () => void;
  onReleased: () => void;
  onZoom: (rate: number, distanceMoved: number) => void;
}

export type ZoomClockProps = ZoomClockStateProps & ZoomClockDispatchProps;

const mapStateToProps = (state: AppState): ZoomClockStateProps => {
  const {
    followingPath,
    followingUser,
    labelsEnabled,
    timelineNow,
    zoomClockPressed,
  } = state.flags;
  return {
    activitySelected: !!state.options.selectedActivityId,
    allowZoom: shouldShowTimeline(state),
    bottom: dynamicClockBottom(state),
    followingPath,
    followingUser,
    labelsEnabled,
    nowMode: timelineNow || (state.options.scrollTime > utils.now() - constants.timing.timelineCloseToNow),
    pressed: zoomClockPressed,
  }
}

const mapDispatchToProps = (dispatch: Function): ZoomClockDispatchProps => {
  const onBackSelected = () => {
    log.trace('ZoomClock onBackSelected');
    dispatch(newAction(AppAction.jumpToBackTime));
  }
  const onNowSelected = () => {
    log.trace('ZoomClock onNowSelected');
    dispatch(newAction(AppAction.jumpToNow));
  }
  const onPressed = () => {
    log.trace('ZoomClock onPressed');
    dispatch(newAction(AppAction.flagEnable, 'zoomClockPressed'));
  }
  const onReleased = () => {
    log.trace('ZoomClock onReleased');
    dispatch(newAction(AppAction.flagDisable, 'zoomClockPressed'));
  }
  const onZoom = (rate: number, distanceMoved: number) => {
    log.trace('ZoomClock onZoom', rate);
    dispatch(newAction(AppAction.timelineRelativeZoom, { rate }));
    dispatch(newAction(AppAction.setAppOption, { zoomClockMoved: distanceMoved }));
  }
  const dispatchers = {
    onBackSelected,
    onNowSelected,
    onPressed,
    onReleased,
    onZoom,
  }
  return dispatchers;
}

const ZoomClockContainer = connect<ZoomClockStateProps, ZoomClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ZoomClock as any);

export default ZoomClockContainer;
