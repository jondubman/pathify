import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  dynamicClockBottom,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import ZoomClock from 'presenters/ZoomClock';
import log from 'shared/log';

interface ZoomClockStateProps {
  bottom: number;
  nowMode: boolean;
}

interface ZoomClockDispatchProps {
  onZoom: (rate: number) => void;
}

export type ZoomClockProps = ZoomClockStateProps & ZoomClockDispatchProps;

const mapStateToProps = (state: AppState): ZoomClockStateProps => {
  return {
    bottom: dynamicClockBottom(state),
    nowMode: state.flags.timelineNow || (state.options.scrollTime > utils.now() - constants.timing.timelineCloseToNow),
  }
}

const mapDispatchToProps = (dispatch: Function): ZoomClockDispatchProps => {
  const onZoom = (rate: number) => {
    log.trace('onZoom', rate);
    dispatch(newAction(AppAction.timelineRelativeZoom, { rate }));
  }
  const dispatchers = {
    onZoom,
  }
  return dispatchers;
}

const ZoomClockContainer = connect<ZoomClockStateProps, ZoomClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ZoomClock as any);

export default ZoomClockContainer;
