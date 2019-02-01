import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import log from 'lib/log';
import { AppState } from 'lib/reducer';
import { dynamicTimelineHeight } from 'lib/selectors';

import GeolocationPanel from 'presenters/GeolocationPanel';

interface GeolocationPanelStateProps {
  marginBottom: number;
  open: boolean;
}

interface GeolocationPanelDispatchProps {
  setGeolocationMode: (id: number) => void;
}

export type GeolocationPanelProps = GeolocationPanelStateProps & GeolocationPanelDispatchProps;

const mapStateToProps = (state: AppState): GeolocationPanelStateProps => {
  return {
    marginBottom: dynamicTimelineHeight(state),
    open: state.ui.panels.geolocation.open,
  }
}

const mapDispatchToProps = (dispatch: any): GeolocationPanelDispatchProps => {
  const dispatchers = {
    setGeolocationMode: (id: number) => {
      dispatch(newAction(appAction.SET_GEOLOCATION_MODE, id));
    },
  }
  return dispatchers;
}

const GeolocationPanelContainer = connect<GeolocationPanelStateProps, GeolocationPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationPanel as any);

export default GeolocationPanelContainer;
