import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import TimelineSpans from 'presenters/TimelineSpans';
import {
  ActivityDataExtended,
} from 'shared/activities';

export interface TimelineSpansStateProps {
  activities: ActivityDataExtended[];
  currentActivityId: string;
  selectedActivityId: string;
}

export interface TimelineSpansDispatchProps {
}

export type TimelineSpansProps = TimelineSpansStateProps & TimelineSpansDispatchProps;

const mapStateToProps = (state: AppState): TimelineSpansStateProps => {
  const { currentActivityId, selectedActivityId } = state.options;
  return {
    activities: state.cache.activities,
    currentActivityId: currentActivityId || '',
    selectedActivityId: selectedActivityId || '',
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineSpansDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineSpansContainer = connect<TimelineSpansStateProps, TimelineSpansDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineSpans as any);

export default TimelineSpansContainer;
