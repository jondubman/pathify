import React, {
  Component,
} from 'react';

import {
  View,
} from 'react-native';

import Mapbox from '@mapbox/react-native-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv';
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import {
  appAction,
  newAction,
} from 'lib/actions';

import constants from 'lib/constants';
import log from 'lib/log';
import utils from 'lib/utils';

interface Props extends React.Props<any> {
  height: number,
  mapStyleURL: string,
  opacity: number,
  width: number,
}

class MapArea extends Component<Props> {

  _map: null; // set by MapBox.MapView ref function below

  constructor(props: Props) {
    super(props);

    this.getPointInView = this.getPointInView.bind(this);
    this.getVisibleBounds = this.getVisibleBounds.bind(this);
    this.flyTo = this.flyTo.bind(this);
    this.moveTo = this.moveTo.bind(this);
    this.fitBounds = this.fitBounds.bind(this);
    this.onRegionWillChange = this.onRegionWillChange.bind(this);
    this.onRegionDidChange = this.onRegionDidChange.bind(this);
    this.onDidFinishRenderingMapFully = this.onDidFinishRenderingMapFully.bind(this);
    this.onPress = this.onPress.bind(this);
    this.zoomTo = this.zoomTo.bind(this);

    (utils as any).mapArea = this; // expose component for imperative use TODO use a better way
  }

  render() {
    const { height, mapStyleURL, opacity, width } = this.props;
    const mapStyle = {
      alignSelf: 'center',
      height,
      width,
    } as any;
    const { lon, lat } = constants.map.default;

    return (
      <View style={{ opacity }}>
        <Mapbox.MapView
          centerCoordinate={[ lon, lat ]}
          contentInset={[ 0, 0, 0, 0 ]}
          heading={0}
          logoEnabled={false}
          compassEnabled={false}
          pitchEnabled={false}
          ref={map => { this._map = map; }}
          rotateEnabled={true}
          scrollEnabled={true}
          showUserLocation={false}
          style={mapStyle}
          styleURL={mapStyleURL}
          userTrackingMode={Mapbox.UserTrackingModes.None}
          zoomEnabled={true}
          zoomLevel={constants.map.default.zoom}
        >
        </Mapbox.MapView>
      </View>
    )
  }

  // https://github.com/mapbox/react-native-mapbox-gl/blob/master/docs/MapView.md

  // coordinates is [ lon, lat ]
  async getPointInView(coordinates) {
    if (this._map) {
      return await this._map.getPointInView(coordinates);
    }
  }

  // return the coordinate bounds [NE [lon, lat], SW [lon, lat]] visible in the users’s viewport.
  async getVisibleBounds() {
    if (this._map) {
      return await this._map.getVisibleBounds();
    }
  }

  // duration is optional
  // Note the difference between flyTo and moveTo is that flyTo uses Mapbox.CameraModes.Flight.
  flyTo(coordinates, duration) {
    if (this._map) {
      this._map.flyTo(coordinates, duration);
    }
  }

  // duration is optional
  moveTo(coordinates, duration) {
    if (this._map) {
      this._map.moveTo(coordinates, duration);
    }
  }

  // padding is [ verticalPadding, horizontalPadding ]
  //   (TODO What are the units exactly? Pixels?)
  // all coords: [lon, lat]
  // duration is msec.
  fitBounds(neCoords, swCoords, padding, duration) {
    if (this._map) {
      this._map.fitBounds(neCoords, swCoords, padding, duration);
    }
  }

  onRegionWillChange(...args) {
    log.trace('onRegionWillChange', args);
  }

  onRegionDidChange(...args) {
    log.trace('onRegionDidChange', args);

    // Detect if user panned the map, as in https://github.com/mapbox/react-native-mapbox-gl/issues/1079
    if (args[0].properties.isUserInteraction) {
      utils.dispatch(newAction(appAction.USER_PANNED_MAP));
    }
  }

  onDidFinishRenderingMapFully(...args) {
    log.trace('onDidFinishRenderingMapFully', args);
  }

  // [{ geometry:
  //     { type: 'Point',
  //       coordinates: [ -122.33381520370017, 47.66132942045516 ]
  //     },
  //     properties: { screenPointY: 120.5, screenPointX: 347 },
  //     type: 'Feature'
  // }]

  async onPress(...args) {
    log.trace('onPress', args);
    const bounds = await this.getVisibleBounds();
    log.trace('onPress: bounds', bounds[0][1], bounds[0][0], bounds[1][1], bounds[1][0]);
  }

  // TODO zoomTo is not really working right now
  // https://github.com/mapbox/react-native-mapbox-gl/issues/988
  zoomTo(zoomLevel) {
    if (this._map) {
      // this._map.zoomTo(zoomLevel);
    }
  }
}

export default MapArea;
