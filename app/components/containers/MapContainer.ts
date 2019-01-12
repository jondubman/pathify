// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.

import { connect } from 'react-redux';

import constants from 'lib/constants';
import { AppState } from 'lib/reducer';
import utils from 'lib/utils';

import MapArea from 'presenters/MapArea';

const mapStateToProps = (state: AppState, ownProps: any) => {
  const mapStyle = constants.mapStyles[state.options.mapStyle];
  const { height, width } = utils.windowSize();
  return {
    height: height - constants.timeline.height,
    mapStyleURL: mapStyle.url,
    opacity: mapStyle.opacity,
    width,
    userLoc: state.loc,
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
