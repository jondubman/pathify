import { connect } from 'react-redux';

import {
  currentActivity,
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import DebugInfo from 'presenters/DebugInfo';

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
    text = `${activity.count}`;
    if (activity.odo) {
      text += `, ${Math.round(activity.odo)}m`;
    }
    if (activity.path) {
      text +=  `, ${activity.path.length} segments`;
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
