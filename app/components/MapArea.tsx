import React, {
  Component,
  Fragment,
} from 'react';

import {
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Mapbox from '@mapbox/react-native-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv'; // deliberately omitted from repo
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import constants from 'lib/constants';
import log from 'lib/log';

import CompassButtonContainer from 'containers/CompassButtonContainer';
import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';
import GeolocationPanelContainer from 'containers/GeolocationPanelContainer';
import { MapAreaProps } from 'containers/MapContainer';
import Pulsar from 'presenters/Pulsar';

// Public interface to singleton underlying Mapbox component
export interface IMapUtils {
  flyTo: Function;
  getVisibleBounds: Function;
  setCamera: Function,
}

let singletonMap: (Component<MapAreaProps> & IMapUtils | null) = null; // ref to singleton MapArea component that is created

export function MapUtils(): IMapUtils | null {
  if (!singletonMap) {
    return null; // TODO
  }
  return (singletonMap as any).getMap();
}

// For now this is intended to be a singleton component. TODO enforce via ref function.

class MapArea extends Component<MapAreaProps> {

  _map: null; // set by MapBox.MapView ref function below

  constructor(props: MapAreaProps) {
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
    this.setCamera = this.setCamera.bind(this);
    this.zoomTo = this.zoomTo.bind(this);
  }

  getMap(): IMapUtils {
    return { // methods exposed for imperative use as needed
      flyTo: this.flyTo,
      getVisibleBounds: this.getVisibleBounds,
      setCamera: this.setCamera,
    }
  }

  render() {
    const {
      backgroundTapped,
      height,
      mapHidden,
      mapStyleURL,
      opacity,
      width,
      userLoc,
    } = this.props;

    const hiddenStyle = {
      height,
      opacity,
    } as any; // as any: https://github.com/Microsoft/TypeScript/issues/18744

    const mapStyle = {
      alignSelf: 'center',
      height,
      width,
    }
    const viewStyle = {
      height,
      opacity,
    }
    const mapCenterLon = constants.map.default.lon;
    const mapCenterLat = constants.map.default.lat;
    const showUserMarker = !!userLoc; // boolean (related to use of userLoc! postfix bang for non-null assertion below)

    if (mapHidden) {
      // TODO this loses map orientation, position, zoom, etc. but on the plus side, it stops consuming resources.
      // onPressIn is instantaneous, unlike onPress which waits for the tap to end.
      return (
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback
            onPressIn={backgroundTapped}
          >
            <View style={hiddenStyle} />
          </TouchableWithoutFeedback>
          <GeolocationPanelContainer />
        </View>
      )
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={viewStyle}>
          <Mapbox.MapView
            attributionEnabled={true}
            centerCoordinate={[ mapCenterLon, mapCenterLat ]}
            compassEnabled={false}
            contentInset={[ 0, 0, 0, 0 ]}
            heading={0}
            logoEnabled={true}
            onPress={this.onPress}
            onRegionDidChange={this.onRegionDidChange}
            onRegionWillChange={this.onRegionWillChange}
            pitchEnabled={false}
            ref={map => {
              this._map = map;
              singletonMap = this;
            }}
            rotateEnabled={true}
            scrollEnabled={true}
            showUserLocation={false}
            style={mapStyle}
            styleURL={mapStyleURL}
            userTrackingMode={Mapbox.UserTrackingModes.None}
            zoomEnabled={true}
            zoomLevel={constants.map.default.zoom}
          >
            {showUserMarker ?
              <Pulsar
                id="userLocationMarker"
                lon={userLoc!.data.lon}
                lat={userLoc!.data.lat}
                color={constants.colors.user}
              />
              :
              null
            }
          </Mapbox.MapView>
        </View>
        <FollowMeButtonContainer />
        <CompassButtonContainer />
        <GeolocationPanelContainer />
      </View>
    )
  }

  // https://github.com/mapbox/react-native-mapbox-gl/blob/master/docs/MapView.md

  // coordinates is [ lon, lat ]
  async getPointInView(coordinates) {
    if (this._map) {
      const mapView = this._map as any;
      return await mapView.getPointInView(coordinates);
    }
  }

  // return the coordinate bounds [NE [lon, lat], SW [lon, lat]] visible in the users’s viewport.
  async getVisibleBounds() {
    if (this._map) {
      const mapView = this._map as any;
      const bounds = await mapView.getVisibleBounds();
      return bounds;
    }
  }

  // duration is optional
  // Note the difference between flyTo and moveTo is that flyTo uses Mapbox.CameraModes.Flight.
  flyTo(coordinates, duration) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.flyTo(coordinates, duration);
    }
  }

  // duration is optional
  moveTo(coordinates, duration) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.moveTo(coordinates, duration);
    }
  }

  // padding is [ verticalPadding, horizontalPadding ]
  //   (TODO What are the units exactly? Pixels?)
  // all coords: [lon, lat]
  // duration is msec.
  fitBounds(neCoords, swCoords, padding, duration) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.fitBounds(neCoords, swCoords, padding, duration);
    }
  }

  onRegionWillChange(...args) {
    // log.trace('onRegionWillChange', args);

    // Detect if user panned the map, as in https://github.com/mapbox/react-native-mapbox-gl/issues/1079
    if (args[0].properties.isUserInteraction) {
      this.props.userMovedMap(args);
    }
    this.props.mapRegionChanging(args[0]);
  }

  onRegionDidChange(...args) {
    // log.trace('onRegionDidChange', args);
    this.props.mapRegionChanged(args[0]);
  }

  onDidFinishRenderingMapFully(...args) {
    // log.trace('onDidFinishRenderingMapFully', args);
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
    this.props.mapTapped(args);
  }

  setCamera(config: object) {
    const mapView = this._map as any;
    mapView.setCamera(config);
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
