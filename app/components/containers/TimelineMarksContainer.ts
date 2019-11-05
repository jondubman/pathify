import { connect } from 'react-redux';
import * as Victory from 'victory-native';

import {
  MarkEvents,
} from 'shared/marks';
import TimelineMarks from 'presenters/TimelineMarks';
import { AppState } from 'lib/state';

export interface TimelineMarksStateProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  currentActivityId: string;
  data: MarkEvents;
  selectedActivityId: string;
}

export interface TimelineMarksDispatchProps {
}

export type TimelineMarksProps = TimelineMarksStateProps & TimelineMarksDispatchProps;

const mapStateToProps = (state: AppState): TimelineMarksStateProps => {
  // const marks: MarkEvents = markList(database.events());
  const { currentActivityId, selectedActivityId } = state.options;
  const marks: MarkEvents = [];
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
