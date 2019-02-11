import { connect } from 'react-redux';
import { DomainPropType } from 'victory-native';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/state';
import Timeline from 'presenters/Timeline';

export interface TimelineStateProps {
  refTime: number;
  startupTime: number;
}

export interface TimelineDispatchProps {
  zoomDomainChanged: (domain: DomainPropType) => void;
}

export type TimelinePanelProps = TimelineStateProps & TimelineDispatchProps;

const mapStateToProps = (state: AppState): TimelineStateProps => {
  return {
    refTime: state.options.refTime,
    startupTime: state.options.startupTime,
  }
}

const mapDispatchToProps = (dispatch: Function): TimelineDispatchProps => {
  const zoomDomainChanged = (domain: DomainPropType) => {
    log.trace('zoomDomainChanged', domain);
    dispatch(newAction(appAction.TIMELINE_ZOOMED, domain));
  }
  const dispatchers = {
    zoomDomainChanged,
  }
  return dispatchers;
}

const TimelineContainer = connect<TimelineStateProps, TimelineDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Timeline as any);

export default TimelineContainer;
