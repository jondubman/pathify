import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicTimelineHeight } from 'lib/selectors';
import { AppState } from 'lib/state';
import RefTime from 'presenters/RefTime';
import constants from 'lib/constants';
import utils from 'lib/utils';

interface RefTimeStateProps {
  bottom: number;
  scrollTime: number;
  viewTime: number;
  hours: string;
  minutes: string;
  seconds: string;
  hundredths: string;
  ampm: string,
  day: string,
  month: string,
  dayOfMonth: string,
  year: string,
}

interface RefTimeDispatchProps {
  onPress: () => void;
}

export type RefTimeProps = RefTimeStateProps & RefTimeDispatchProps;

const mapStateToProps = (state: AppState): RefTimeStateProps => {
  const { scrollTime, viewTime } = state.options;
  const d = new Date(scrollTime);
  const { twoDigitString } = utils;
  const hours24 = d.getHours(); // TODO 24-hour clock
  const hours = (hours24 % 12) ? (hours24 % 12).toString() : '12'; // '12' for hours24 of 0 or 12
  const minutes = twoDigitString(d.getMinutes());
  const seconds = twoDigitString(d.getSeconds());
  const hundredths = twoDigitString(d.getMilliseconds() / 10).substr(0, 2);
  const ampm = (hours24 >= 12) ? 'PM' : 'AM';
  const day = constants.days[d.getDay()];
  const month = constants.months[d.getMonth()];
  const dayOfMonth = d.getDate().toString();
  const year = d.getFullYear().toString();

  return {
    bottom: dynamicTimelineHeight(state),
    scrollTime,
    viewTime,
    hours,
    minutes,
    seconds,
    hundredths,
    ampm,
    day,
    month,
    dayOfMonth,
    year,
  }
}

const mapDispatchToProps = (dispatch: Function): RefTimeDispatchProps => {
  const dispatchers = {
    onPress: () => {
      dispatch(newAction(AppAction.clockPress)); // treat like clockPress
    }
  }
  return dispatchers;
}

const RefTimeContainer = connect<RefTimeStateProps, RefTimeDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(RefTime as any);

export default RefTimeContainer;
