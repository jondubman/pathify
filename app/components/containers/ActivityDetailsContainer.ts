import { connect } from 'react-redux';

import {
  dynamicTopBelowActivityList,
  getCachedPathInfo,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import ActivityDetails from 'presenters/ActivityDetails';
import {
  ActivityDataExtended,
} from 'shared/activities';
import log from 'shared/log';
import {
  metersPerSecondToMilesPerHour,
  metersPerSecondToMinutesPerMile,
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
  paceText: string;
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
  let averagePaceText = '';
  let averageSpeedText = '';
  let distanceText = '';
  let elevationText = '';
  let paceText = '0';
  let partialDistance = 0;
  let speedText = '';
  let timeText = '';
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
    paceText,
    speedText,
    timelineNow,
    timeText,
    top,
    visible: true,
  }
  try {
    top = dynamicTopBelowActivityList(state);
    const info = getCachedPathInfo(state);
    const { currentActivityId, scrollTime } = state.options;

    if (info) {
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
        if (info.pace) {
          paceText = minutesToString(metersPerSecondToMinutesPerMile(info.pace));
        }
        // TODO support legitimate negative elevation. -1 is getting reported for elevation in the Simulator.
        elevationText = (!info.ele || info.ele < 0) ? '' : metersToFeet(info.ele).toFixed(0);
        totalTime = activity.tLast - activity.tStart;
        if (totalDistance && totalTime) {
          const mps = totalDistance / (totalTime / 1000);
          const averagePace = metersPerSecondToMinutesPerMile(mps);
          averagePaceText = minutesToString(averagePace);
          averageSpeedText = metersPerSecondToMilesPerHour(mps).toFixed(1);
        }
      }
      return {
        averagePaceText,
        averageSpeedText,
        distanceText,
        elevationText,
        isCurrent,
        paceText,
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
