import { connect } from 'react-redux';

import constants from 'lib/constants';
import {
  selectedOrCurrentActivity,
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import DebugInfo from 'presenters/DebugInfo';
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

export interface DebugInfoStateProps {
  text: string;
  top: number;
}

export interface DebugInfoDispatchProps {
}

export type DebugInfoProps = DebugInfoStateProps & DebugInfoDispatchProps;

const mapStateToProps = (state: AppState): DebugInfoStateProps => {
  const activity = selectedOrCurrentActivity(state);
  let text = '';
  if (activity) {
    const activityLength = (activity.tLastUpdate - activity.tStart); // msec
    text = `Time ${msecToString(activityLength)}\n`;
    text += `Events ${activity.count}\n`;
    if (activity.odo) {
      const odo = activity.odo - activity.odoStart;
      text += metersToMilesText(odo);
      // if (activityLength) {
      //   const speed = metersPerSecondToMilesPerHour(odo / (activityLength / 1000));
      //   text += '\n';
      //   text += `Avg speed ${speed.toFixed(2)} mph`;
      // }
    }
    if (activity.maxGapTime) {
      text += '\n';
      text += `maxGapTime ${Math.round(activity.maxGapTime/1000)} sec`;
    }
    if (activity.maxGapDistance) {
      text += '\n';
      text += `maxGap ${Math.round(activity.maxGapDistance)} meters`;
    }
  }
  return {
    text,
    top: dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset,
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
