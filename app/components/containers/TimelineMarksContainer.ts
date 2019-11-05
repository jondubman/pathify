import { connect } from 'react-redux';
import * as Victory from 'victory-native';

import TimelineMarks from 'presenters/TimelineMarks';
import { AppState } from 'lib/state';
import {
  MarkEvents,
  markList,
} from 'shared/marks';
import database from 'shared/database';

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
  const marks: MarkEvents = markList(database.events()); // TODO4 remove this dependency
  // const marks: MarkEvents = [];
  return {
    currentActivityId,
    data: marks,
    selectedActivityId,
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
