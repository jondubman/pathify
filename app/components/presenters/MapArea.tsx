import React, {
  Component,
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
import PulsarsContainer from 'containers/PulsarsContainer';
import Pulsar from 'presenters/Pulsar';

// Public interface to singleton underlying Mapbox component
export type Lon = number;
export type Lat = number;
export type LonLat = [Lon, Lat];
export type Bounds = [LonLat, LonLat] | null;

// For now this is intended to be a singleton component. TODO enforce via ref function.

class MapArea extends Component<MapAreaProps> {

  _map: null; // set by MapBox.MapView ref function below

  constructor(props: MapAreaProps) {
    super(props);

    this.getCenter = this.getCenter.bind(this);
    this.getPointInView = this.getPointInView.bind(this);
    this.getVisibleBounds = this.getVisibleBounds.bind(this);
    this.flyTo = this.flyTo.bind(this);
    this.getZoom = this.getZoom.bind(this);
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
    return {
      flyTo: this.flyTo,
      moveTo: this.moveTo,
      getCenter: this.getCenter,
      getMap: this.getMap,
      getVisibleBounds: this.getVisibleBounds,
      getZoom: this.getZoom,
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
            <PulsarsContainer />
          </Mapbox.MapView>
        </View>
        <FollowMeButtonContainer />
        <CompassButtonContainer />
        <GeolocationPanelContainer />
      </View>
    )
  }

  // https://github.com/mapbox/react-native-mapbox-gl/blob/master/docs/MapView.md

  // padding is [ verticalPadding, horizontalPadding ]
  //   (TODO What are the units exactly? Pixels?)
  // all coords: [lon, lat]
  // duration is msec.
  fitBounds(neCoords: LonLat, swCoords: LonLat, padding: number, duration: number) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.fitBounds(neCoords, swCoords, padding, duration);
    }
  }

  // duration is optional
  // Note the difference between flyTo and moveTo is that flyTo uses Mapbox.CameraModes.Flight.
  flyTo(coordinates: LonLat, duration: number) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.flyTo(coordinates, duration);
    }
  }

  async getCenter(): Promise<LonLat> {
    if (this._map) {
      const mapView = this._map as any;
      const center = await mapView.getCenter();
      return center;
    }
    return [0, 0]; // TODO should never happen
  }

  // coordinates is [ lon, lat ]
  async getPointInView(coordinates) {
    if (this._map) {
      const mapView = this._map as any;
      return await mapView.getPointInView(coordinates);
    }
  }

  // return the coordinate bounds [NE [lon, lat], SW [lon, lat]] visible in the users’s viewport.
  async getVisibleBounds(): Promise<Bounds> {
    if (this._map) {
      const mapView = this._map as any;
      const bounds = await mapView.getVisibleBounds();
      return bounds;
    }
    return null;
  }

  async getZoom(): Promise<number> {
    if (this._map) {
      const mapView = this._map as any;
      const zoom = await mapView.getZoom();
      return zoom;
    }
    return 0; // TODO should never happen
  }


  // duration is optional
  moveTo(coordinates: LonLat, duration: number) {
    if (this._map) {
      const mapView = this._map as any;
      mapView.moveTo(coordinates, duration);
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

// methods exposed for imperative use as needed
export interface IMapUtils {
  flyTo: (coordinates: LonLat, duration: number) => void;
  moveTo: (coordinates: LonLat, duration: number) => void;
  getCenter: () => Promise<LonLat>
  getMap: () => IMapUtils;
  getVisibleBounds: () => Promise<Bounds>;
  getZoom: () => Promise<number>;
  setCamera: (config: object) => void;
}

export enum CenterMapOption {
  'absolute' = 'absolute',
  'relative' = 'relative',
}

export interface CenterMapParams {
  center: LonLat;
  option: CenterMapOption;
  // zoom?: any; // TODO
}

// ref to singleton MapArea component that is created
let singletonMap: (Component<MapAreaProps> & IMapUtils) | null = null;

export function MapUtils(): IMapUtils | null {
  if (!singletonMap) {
    return null; // TODO
  }
  return singletonMap.getMap();
}

export default MapArea;
