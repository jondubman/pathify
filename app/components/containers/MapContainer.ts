// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.

import { connect } from 'react-redux';

import constants from 'lib/constants';
import MapArea from 'presenters/MapArea';

const mapStateToProps = (state: any, ownProps: any) => {
  const mapStyle = constants.mapStyles[state.options.mapStyle];
  return {
    mapStyleURL: mapStyle.url,
    opacity: mapStyle.opacity,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  const dispatchers = {
  }
  return dispatchers;
}

const MapContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(MapArea);

export default MapContainer;
