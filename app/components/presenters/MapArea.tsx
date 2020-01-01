import _ from 'lodash'
import React, {
  Component,
} from 'react';

import {
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// https://github.com/react-native-mapbox-gl/maps/blob/master/docs/MapView.md
import Mapbox from '@react-native-mapbox-gl/maps';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv'; // deliberately omitted from repo
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import { MapAreaProps } from 'containers/MapContainer';
import MapDimmerContainer from 'containers/MapDimmerContainer';
import PathsContainer from 'components/containers/PathsContainer';
import PulsarsContainer from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import log from 'shared/log';

// Public interface to singleton underlying Mapbox component
import { LonLat } from 'shared/locations';
export type Bounds = [LonLat, LonLat] | null; // NE, SW

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
      fitBounds: this.fitBounds,
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
    const initialZoomLevel = 10;
    return (
      <View style={{ flex: 1 }}>
        <View style={viewStyle}>
          <Mapbox.MapView
            attributionEnabled={true}
            compassEnabled={false}
            contentInset={[0, 0, 0, 0]}
            logoEnabled={true}
            onDidFinishRenderingMapFully={this.onDidFinishRenderingMapFully}
            onPress={this.onPress}
            onRegionDidChange={this.onRegionDidChange}
            onRegionWillChange={this.onRegionWillChange}
            pitchEnabled={false}
            ref={map => {
              this._map = map as Mapbox.MapView;
              singletonMap = this;
            }}
            rotateEnabled={true}
            scrollEnabled={true}
            style={mapStyle}
            styleURL={mapStyleURL}
            zoomEnabled={true}
          >
            <Mapbox.Camera
              animationDuration={0}
              followUserLocation={false}
              heading={0}
              ref={camera => { this._camera = camera }}
              zoomLevel={initialZoomLevel}
            />
            <MapDimmerContainer />
            <PathsContainer />
            <PulsarsContainer />
          </Mapbox.MapView>
        </View>
      </View>
    )
  }

  fitBounds(neCoords: LonLat, swCoords: LonLat, paddingVerticalHorizontal: [number, number], duration: number) {
    if (this._camera) {
      if (!(neCoords[0] === 0 && neCoords[1] === 0 && swCoords[0] === 0 && swCoords[1] === 0)) {
        const camera = this._camera!;
        camera.fitBounds(neCoords, swCoords, paddingVerticalHorizontal, duration);
      }
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
    try {
      if (this._map) {
        const mapView = this._map;
        const center = await mapView.getCenter();
        return center as LonLat;
      }
      return [0, 0]; // TODO should never happen
    } catch (err) {
      return [0, 0]; // TODO should never happen
    }
  }

  async getPointInView(coordinates: LonLat): Promise<number[]> {
    try {
      if (this._map) {
        const mapView = this._map;
        return await mapView.getPointInView(coordinates);
      }
      return [0, 0]; // TODO should never happen
    } catch (err) {
      return [0, 0]; // TODO should never happen
    }
  }

  // return the coordinate bounds [NE LonLat, SW LonLat] visible in the users’s viewport.
  async getVisibleBounds(): Promise<Bounds> {
    try {
      if (this._map) {
        const mapView = this._map;
        // TODO double casting types until index.d.ts TypeScript declaration is fixed
        const bounds = await mapView.getVisibleBounds() as unknown as Bounds;
        return bounds;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  async getZoom(): Promise<number> {
    try {
      if (this._map) {
        const mapView = this._map;
        const zoom = await mapView.getZoom();
        return zoom;
      }
      return 0; // TODO should never happen
    } catch (err) {
      return 0; // TODO should never happen
    }
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
    log.trace('onDidFinishRenderingMapFully --> mapRendered', args);
    this.props.mapRendered(true);
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
  fitBounds: (neCoords: LonLat, swCoords: LonLat, paddingVerticalHorizontal: [number, number], duration: number) => void;
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
