import _ from 'lodash'
import React, {
  Component,
} from 'react';

import {
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Mapbox from '@react-native-mapbox-gl/maps';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv'; // deliberately omitted from repo
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import { MapAreaProps } from 'containers/MapContainer';
import MapDimmerContainer from 'containers/MapDimmerContainer';
import PathsContainer from 'components/containers/PathsContainer';
import PulsarsContainer from 'containers/PulsarsContainer';
import { AppAction, newAction } from 'lib/actions';
import constants from 'lib/constants';
import store from 'lib/store';
import log from 'shared/log';

// Public interface to singleton underlying Mapbox component
import { LonLat } from 'shared/locations';
export type Bounds = [LonLat, LonLat] | null;

const followUserOnce = _.once(() => {
  store.dispatch(newAction(AppAction.startFollowingUser));
})

// For now this is intended to be a singleton component. TODO enforce via ref function.

class MapArea extends Component<MapAreaProps> {

  _camera: Mapbox.Camera | null = null; // set by Camera ref function below
  _map: Mapbox.MapView | null = null; // set by MapBox.MapView ref function below

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
  }

  getMap(): IMapUtils{
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
      width,
    } = this.props;

    const hiddenStyle = {
      height,
    } as any; // as any: https://github.com/Microsoft/TypeScript/issues/18744

    const mapStyle = {
      alignSelf: 'center',
      height,
      width,
    }
    const viewStyle = {
      height,
    }
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
        </View>
      )
    }
    return (
      <View style={{ flex: 1 }}>
        <View style={viewStyle}>
          <Mapbox.MapView
            attributionEnabled={true}
            compassEnabled={false}
            contentInset={[ 0, 0, 0, 0 ]}
            logoEnabled={true}
            onPress={this.onPress}
            onRegionDidChange={this.onRegionDidChange}
            onRegionWillChange={this.onRegionWillChange}
            pitchEnabled={false}
            ref={map => {
              this._map = map as Mapbox.MapView;
              singletonMap = this;
              // startFollowingUser deferred until map loaded, so map centering is possible when 1st location comes in.
              setTimeout(followUserOnce, 500); // TODO random-looking constant - which also should not be needed
            }}
            rotateEnabled={true}
            scrollEnabled={true}
            style={mapStyle}
            styleURL={mapStyleURL}
            zoomEnabled={true}
          >
            <Mapbox.Camera
              followUserLocation={false}
              heading={0}
              ref={camera => { this._camera = camera }}
              zoomLevel={constants.map.default.zoom}
            />
            <MapDimmerContainer />
            <PathsContainer />
            <PulsarsContainer />
          </Mapbox.MapView>
        </View>
      </View>
    )
  }

  // https://github.com/mapbox/react-native-mapbox-gl/blob/master/docs/MapView.md

  // padding is [ verticalPadding, horizontalPadding ]
  //   (TODO What are the units exactly? Pixels?)
  // all coords: [lon, lat]
  // duration is msec.
  fitBounds(neCoords: LonLat, swCoords: LonLat, padding: number, duration: number) {
    if (this._camera) {
      const camera = this._camera!;
      camera.fitBounds(neCoords, swCoords, padding, duration);
    }
  }

  // Note the difference between flyTo and moveTo is that flyTo uses Mapbox.CameraModes.Flight.
  flyTo(coordinates: LonLat, duration: number = 0) {
    if (this._camera) {
      const camera = this._camera!;
      camera.flyTo(coordinates, duration);
    }
  }

  async getCenter(): Promise<LonLat> {
    if (this._map) {
      const mapView = this._map;
      const center = await mapView.getCenter();
      return center as LonLat;
    }
    return [0, 0]; // TODO should never happen
  }

  // coordinates is [lon, lat]
  async getPointInView(coordinates) {
    if (this._map) {
      const mapView = this._map;
      return await mapView.getPointInView(coordinates);
    }
  }

  // return the coordinate bounds [NE [lon, lat], SW [lon, lat]] visible in the users’s viewport.
  async getVisibleBounds(): Promise<Bounds> {
    if (this._map) {
      const mapView = this._map;
      // TODO casting types until index.d.ts TypeScript declaration is fixed
      const bounds = await mapView.getVisibleBounds() as unknown as Bounds;
      return bounds;
    }
    return null;
  }

  async getZoom(): Promise<number> {
    if (this._map) {
      const mapView = this._map;
      const zoom = await mapView.getZoom();
      return zoom;
    }
    return 0; // TODO should never happen
  }

  // duration is optional
  moveTo(coordinates: LonLat, duration: number) {
    if (this._camera) {
      const camera = this._camera!;
      camera.moveTo(coordinates, duration);
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
    // log.trace('onRegionDidChange');
    this.props.mapRegionChanged(args[0]);
  }

  onDidFinishRenderingMapFully(...args) {
    // log.trace('onDidFinishRenderingMapFully', args);
  }

  async onPress(...args) {
    log.trace('onPress', args);
    this.props.mapTapped(args);
  }

  setCamera(config: object) {
    if (this._camera) {
      const camera = this._camera!;
      camera.setCamera(config);
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

// ref to singleton MapArea component that is created
// TODO this seems cumbersome - seek a simpler way
let singletonMap: (Component<MapAreaProps> & IMapUtils) | null = null;

export function MapUtils(): IMapUtils | null {
  if (!singletonMap) {
    return null; // TODO
  }
  return singletonMap.getMap();
}

export default MapArea;
