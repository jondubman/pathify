import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import MapDimmer from 'presenters/MapDimmer';

export interface MapDimmerStateProps {
  mapOpacity: number;
}

export interface MapDimmerDispatchProps {
}

export type MapDimmerProps = MapDimmerStateProps & MapDimmerDispatchProps;

const mapStateToProps = (state: AppState): MapDimmerStateProps => {
  return {
    mapOpacity: state.options.mapOpacity,
  }
}

const mapDispatchToProps = (dispatch: Function): MapDimmerDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const MapDimmerContainer = connect<MapDimmerStateProps, MapDimmerDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapDimmer as any);

export default MapDimmerContainer;
