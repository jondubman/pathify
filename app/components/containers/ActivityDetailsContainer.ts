import { connect } from 'react-redux';

import {
  dynamicTopBelowActivityList,
  getCachedPathInfo,
  showActivityDetailsRowsPreview,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityDetails from 'presenters/ActivityDetails';
import {
  ActivityDataExtended,
} from 'shared/activities';
import {
  numberToModeText,
} from 'shared/locations';
import log from 'shared/log';
import {
  metersPerSecondToMilesPerHour,
  metersPerSecondToMinutesPerMile,
  metersPerSecondToPace,
  metersToFeet,
  metersToMilesText,
  minutesToString,
  msecToTimeString,
} from 'shared/units';

interface ActivityDetailsStateProps {
  averagePaceText: string;
  averageSpeedText: string;
  distanceText: string;
  elevationText: string;
  isCurrent: boolean;
  index: number;
  length: number;
  modeText: string;
  rows: number;
  speedPaceText: string;
  speedText: string;
  timelineNow: boolean;
  timeText: string;
  top: number;
  visible: boolean;
}

interface ActivityDetailsDispatchProps {
}

export type ActivityDetailsProps = ActivityDetailsStateProps & ActivityDetailsDispatchProps;

const mapStateToProps = (state: AppState): ActivityDetailsStateProps => {
  const missing = '-'; // what to use when data is missing
  let averagePaceText = missing;
  let averageSpeedText = missing;
  let distanceText = missing;
  let elevationText = missing;
  let modeText = missing;
  let partialDistance = 0;
  let speedPaceText = missing
  let speedText = missing
  let timeText = missing
  let totalDistance = 0;
  let top = 0;
  let totalTime = 0;
  const { timelineNow } = state.flags;
  const defaults = {
    averagePaceText,
    averageSpeedText,
    distanceText,
    elevationText,
    isCurrent: false,
    index: 0,
    length: 0,
    modeText,
    rows: 0,
    speedPaceText,
    speedText,
    timelineNow,
    timeText,
    top,
    visible: false,
  }
  try {
    top = dynamicTopBelowActivityList(state);
    const info = getCachedPathInfo(state);
    const {
      currentActivityId,
      scrollTime,
    } = state.options;
    if (info) {
      const rows = showActivityDetailsRowsPreview(state);
      const activity = info.activity as ActivityDataExtended;
      const isCurrent = activity && (activity.id === currentActivityId);
      if (activity) {
        if (activity.odo && activity.odoStart) {
          totalDistance = Math.max(activity.odo - activity.odoStart, 0);
        }
        if (activity.tStart) {
          timeText = msecToTimeString(scrollTime - activity.tStart);
        }
        if (info.odo && activity.odoStart) {
          partialDistance = Math.max(info.odo - activity.odoStart, 0); // meters
          distanceText = metersToMilesText(partialDistance, '');
        }
        if (info.speed) {
          speedPaceText = minutesToString(metersPerSecondToPace(info.speed));
          if (speedPaceText.indexOf(':') !== speedPaceText.lastIndexOf(':')) {
            speedPaceText = missing;
          }
          const mph = metersPerSecondToMilesPerHour(info.speed);
          speedText = mph.toFixed(1);
        }
        // TODO support legitimate negative elevation. -1 is getting reported for elevation in the Simulator.
        elevationText = (!info.ele || info.ele < 0) ? missing : metersToFeet(info.ele).toFixed(0);
        totalTime = activity.tLast - activity.tStart;
        if (totalDistance && totalTime) {
          const mps = totalDistance / (totalTime / 1000);
          const averagePace = metersPerSecondToMinutesPerMile(mps);
          averagePaceText = minutesToString(averagePace);
          averageSpeedText = metersPerSecondToMilesPerHour(mps).toFixed(1);
        }
        if (info.mode) {
          modeText = numberToModeText(info.mode);
        }
      }
      return {
        averagePaceText,
        averageSpeedText,
        distanceText,
        elevationText,
        index: info.index,
        isCurrent,
        length: info.length,
        modeText,
        rows,
        speedPaceText,
        speedText,
        timelineNow,
        timeText,
        top,
        visible: true,
      }
    } else {
      return defaults;
    }
  } catch(err) {
    log.warn('Exception in ActivityDetailsContainer mapStateToProps', err);
    return defaults;
  }
}

const mapDispatchToProps = (dispatch: Function): ActivityDetailsDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const ActivityDetailsContainer = connect<ActivityDetailsStateProps, ActivityDetailsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ActivityDetails as any);

export default ActivityDetailsContainer;
