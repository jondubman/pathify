// TODO this component is currently unused

import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import TimelineNavigation from 'presenters/TimelineNavigation';

interface TimelineNavigationStateProps {
}

interface TimelineNavigationDispatchProps {
}

export type TimelineNavigationProps = TimelineNavigationStateProps & TimelineNavigationDispatchProps;

const mapStateToProps = (state: AppState): TimelineNavigationStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineNavigationDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const TimelineNavigationContainer = connect<TimelineNavigationStateProps, TimelineNavigationDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(TimelineNavigation as any);

export default TimelineNavigationContainer;
