import { connect } from 'react-redux';

// import { newAction, reducerAction } from 'lib/actions';
import { AppState } from 'lib/reducer';
import GeolocationPanel from 'presenters/GeolocationPanel';

interface GeolocationPanelStateProps {
  open: boolean;
}

interface GeolocationPanelDispatchProps {
}

export type GeolocationPanelProps = GeolocationPanelStateProps & GeolocationPanelDispatchProps;

const mapStateToProps = (state: AppState): GeolocationPanelStateProps => {
  return {
    open: state.ui.flags.geolocationPanelOpen,
  }
}

const mapDispatchToProps = (dispatch: any): GeolocationPanelDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const GeolocationPanelContainer = connect<GeolocationPanelStateProps, GeolocationPanelDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GeolocationPanel as any);

export default GeolocationPanelContainer;
