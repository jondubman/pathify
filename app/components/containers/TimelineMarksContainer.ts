import { connect } from 'react-redux';
import * as Victory from 'victory-native';

import TimelineMarks from 'presenters/TimelineMarks';
import database from 'lib/database';
import { AppState } from 'lib/state';
import {
  MarkEvents,
  markList,
} from 'lib/marks';

export interface TimelineMarksStateProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  currentActivityId: string;
  data: MarkEvents;
  selectedActivityId: string;
}

export interface TimelineMarksDispatchProps {
}

export type TimelineMarksProps = TimelineMarksStateProps & TimelineMarksDispatchProps;

const mapStateToProps = (state: AppState): TimelineMarksStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  const marks: MarkEvents = markList(database.events()); // TODO remove this dependency
  // const marks: MarkEvents = [];
  return {
    currentActivityId: currentActivityId || '',
    data: marks,
    selectedActivityId: selectedActivityId || '',
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineMarksDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineMarksContainer = connect<TimelineMarksStateProps, TimelineMarksDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineMarks as any);

export default TimelineMarksContainer;
