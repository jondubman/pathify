import { connect } from 'react-redux';

import constants from 'lib/constants';
import {
  dynamicClockBottom,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import ZoomClock from 'presenters/ZoomClock';

interface ZoomClockStateProps {
  bottom: number;
  nowMode: boolean;
}

interface ZoomClockDispatchProps {
}

export type ZoomClockProps = ZoomClockStateProps & ZoomClockDispatchProps;

const mapStateToProps = (state: AppState): ZoomClockStateProps => {
  return {
    bottom: dynamicClockBottom(state),
    nowMode: state.flags.timelineNow || (state.options.scrollTime > utils.now() - constants.timing.timelineCloseToNow),
  }
}

const mapDispatchToProps = (dispatch: Function): ZoomClockDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const ZoomClockContainer = connect<ZoomClockStateProps, ZoomClockDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ZoomClock as any);

export default ZoomClockContainer;
