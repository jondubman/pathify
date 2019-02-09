import { connect } from 'react-redux';

import { appAction, newAction } from 'lib/actions';
import { AppState } from 'lib/reducer';

import GeolocationPanel from 'presenters/GeolocationPanel';

interface GeolocationPanelStateProps {
  mode: number,
  open: boolean;
}

interface GeolocationPanelDispatchProps {
  setGeolocationMode: (id: number) => void;
}

export type GeolocationPanelProps = GeolocationPanelStateProps & GeolocationPanelDispatchProps;

const mapStateToProps = (state: AppState): GeolocationPanelStateProps => {
  return {
    mode: state.options.geolocationModeId,
    open: state.ui.panels.geolocation.open,
  }
}

const mapDispatchToProps = (dispatch: any): GeolocationPanelDispatchProps => {
  const dispatchers = {
    setGeolocationMode: (id: number) => {
      dispatch(newAction(appAction.SET_GEOLOCATION_MODE, id));
      dispatch(newAction(appAction.TOGGLE_PANEL_VISIBILITY));
    },
  }
  return dispatchers;
}

const GeolocationPanelContainer = connect<GeolocationPanelStateProps, GeolocationPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationPanel as any);

export default GeolocationPanelContainer;