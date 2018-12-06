// Note this is the container for MapArea but it's just MapContainer instead of "MapAreaContainer"

import React, {
  Component,
} from 'react';

import { connect } from 'react-redux';

import { appAction } from 'lib/actionTypes';
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
