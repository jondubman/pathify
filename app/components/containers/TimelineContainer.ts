import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';

export interface TimelineStateProps {
}

export interface TimelineDispatchProps {
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineContainer = connect<TimelineStateProps, TimelineDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Timeline as any);

export default TimelineContainer;
