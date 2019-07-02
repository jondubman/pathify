import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';

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

const mapDispatchToProps = (dispatch: Function): GeolocationPanelDispatchProps => {
  const dispatchers = {
    setGeolocationMode: (id: number) => {
      dispatch(newAction(AppAction.setGeolocationMode, id));
      dispatch(newAction(AppAction.togglePanelVisibility));
    },
  }
  return dispatchers;
}

const GeolocationPanelContainer = connect<GeolocationPanelStateProps, GeolocationPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationPanel as any);

export default GeolocationPanelContainer;
