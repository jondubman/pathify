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
import {
  metersToFeet,
  metersToMilesText,
  msecToTimeString,
} from 'shared/units';

interface ActivityDetailsStateProps {
  distanceText: string;
  elevationText: string;
  isCurrent: boolean;
  paceText: string;
  timelineNow: boolean;
  timeText: string;
  top: number;
  visible: boolean;
}

interface ActivityDetailsDispatchProps {
}

export type ActivityDetailsProps = ActivityDetailsStateProps & ActivityDetailsDispatchProps;

const mapStateToProps = (state: AppState): ActivityDetailsStateProps => {
  const top = dynamicTopBelowActivityList(state);
  const info = getCachedPathInfo(state);
  const { scrollTime } = state.options;
  const { timelineNow } = state.flags;
  if (info) {
    const activity = info.activity as ActivityDataExtended;
    let distanceText = '';
    let elevationText = '';
    let timeText = '?'; // TODO this should never show up
    const isCurrent = activity && (activity.id === state.options.currentActivityId);
    if (activity) {
      if (info.odo && activity.odoStart) {
        distanceText = metersToMilesText(Math.max(info.odo - activity.odoStart), '');
      }
      // TODO support legitimate negative elevation. -1 is getting reported for elevation in the Simulator.
      elevationText = (!info.ele || info.ele < 0) ? '' : metersToFeet(info.ele).toFixed(0);
      if (activity.tStart) {
        const t = scrollTime;
        timeText = msecToTimeString(t - activity.tStart);
      }
    }
    return {
      distanceText,
      elevationText,
      isCurrent,
      paceText: 'p',
      timelineNow,
      timeText,
      top,
      visible: true,
    }
  } else {
    return {
      distanceText: '',
      elevationText: '',
      isCurrent: false,
      paceText: '',
      timelineNow,
      timeText: '',
      top,
      visible: false,
    }
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
