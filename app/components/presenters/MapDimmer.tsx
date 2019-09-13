// MapDimmer component
// Intended to be contained within a MapArea.

import * as turf from '@turf/helpers';

import React, {
  PureComponent,
} from 'react';

import Mapbox from '@react-native-mapbox-gl/maps';

import { MapDimmerProps } from 'containers/MapDimmerContainer';
import constants from 'lib/constants';

class MapDimmer extends PureComponent<MapDimmerProps> {

  public dimmerShape = turf.polygon([[ // Entire globe!
    [
      -180,
      -90
    ],
    [
      180,
      -90
    ],
    [
      180,
      90
    ],
    [
      -180,
      90
    ],
    [
      -180,
      -90
    ]
  ]])

  constructor(props) {
    super(props);
  }

  render() {
    const dimmerStyle = {
      fillColor: constants.colors.map.dimmer,
      fillOpacity: 1 - this.props.mapOpacity,
      fillOpacityTransition: { // TODO this seems to have no effect.
        duration: 0,
        delay: 0,
      },
    }
    return (
      <Mapbox.ShapeSource id={'dimmerShape'} key='dimmerShape' shape={this.dimmerShape}>
        <Mapbox.FillLayer id={'dimmerLayer'} key='dimmerFill' style={dimmerStyle} />
      </Mapbox.ShapeSource>
    )
  }
}

export default MapDimmer;
