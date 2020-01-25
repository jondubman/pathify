import {
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import Clock, { ClockStateProps, ClockDispatchProps } from 'presenters/Clock';

interface OwnProps { // matching those of PausedClockContainer
  interactive: boolean;
}

const mapStateToProps = (state: AppState, ownProps?: OwnProps): ClockStateProps => {
  const { timelineNow } = state.flags;
  const t = timelineNow ? state.options.backTime : state.options.nowTime;
  const d = new Date(t);
  return {
    current: false,
    selected: false,
    ghostMode: true,
    hours: d.getHours(),
    milliseconds: d.getMilliseconds(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    stopped: false,
    nowMode: !timelineNow,
    interactive: true, // TODO ignoring ownProps
  }
}

const mapDispatchToProps = (dispatch: Function, ownProps?: OwnProps): ClockDispatchProps => {
  const onPress = (nowMode: boolean) => {
    if (ownProps && ownProps.interactive) { // The test for interactive is likely redundant, but still appropriate.
      if (nowMode) {
        dispatch(newAction(AppAction.jumpToNow));
      } else {
        dispatch(newAction(AppAction.jumpToBackTime));
      }
    }
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const GhostClockContainer = connect<ClockStateProps, ClockDispatchProps, OwnProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Clock as any);

export default GhostClockContainer;
