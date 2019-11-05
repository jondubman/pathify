import { connect } from 'react-redux';

import {
  currentActivity,
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import DebugInfo from 'presenters/DebugInfo';
import { metersPerSecondToMilesPerHour, metersToMiles, msecToString } from 'shared/units';

export interface DebugInfoStateProps {
  dynamicAreaTop: number;
  text: string;
}

export interface DebugInfoDispatchProps {
}

export type DebugInfoProps = DebugInfoStateProps & DebugInfoDispatchProps;

const mapStateToProps = (state: AppState): DebugInfoStateProps => {
  const activity = currentActivity(state);
  let text = '';
  if (activity) {
    const activityLength = (activity.tLastUpdate - activity.tStart); // msec
    text = `Time ${msecToString(activityLength)}\n`;
    text += `Events ${activity.count}\n`;
    if (activity.odo) {
      const odo = activity.odo - activity.odoStart;
      text += `${Math.round(odo)}m, ${metersToMiles(odo).toFixed(2)} miles`;
      if (activityLength) {
        const speed = metersPerSecondToMilesPerHour(odo / (activityLength / 1000));
        text += '\n';
        text += `Avg speed ${speed.toFixed(2)} mph`;
      }
    }
  }
  return {
    dynamicAreaTop: dynamicAreaTop(state),
    text,
  }
}

const mapDispatchToProps = (dispatch: Function): DebugInfoDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const DebugInfoContainer = connect<DebugInfoStateProps, DebugInfoDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(DebugInfo as any);

export default DebugInfoContainer;
