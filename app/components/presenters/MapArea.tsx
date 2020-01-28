import _ from 'lodash'
import React, {
  Component,
} from 'react';

import {
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// https://github.com/react-native-mapbox-gl/maps/blob/master/docs/MapView.md
import Mapbox, { RegionPayload } from '@react-native-mapbox-gl/maps';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv'; // deliberately omitted from repo
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import { MapAreaProps } from 'containers/MapAreaContainer';
import MapDimmerContainer from 'containers/MapDimmerContainer';
import PathsContainer from 'containers/PathsContainer';
import PulsarsContainer from 'containers/PulsarsContainer';
import utils from 'lib/utils';
import log from 'shared/log';

// Public interface to singleton underlying Mapbox component
import { LonLat } from 'shared/locations';
export type Bounds = [LonLat, LonLat] | null; // NE, SW
export type BoundsWithHeading = [LonLat, LonLat, number] | null; // NE, SW, heading

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
    this.onRegionIsChanging = this.onRegionIsChanging.bind(this);
    this.onRegionDidChange = this.onRegionDidChange.bind(this);
    this.onDidFinishRenderingMapFully = this.onDidFinishRenderingMapFully.bind(this);
    this.onPress = this.onPress.bind(this);
    this.setCamera = this.setCamera.bind(this);
    this.zoomTo = this.zoomTo.bind(this);
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
      zoomTo: this.zoomTo,
    }
  }

  render() {
    utils.addToCount('renderMap');
    const {
      backgroundTapped,
      height,
      initialBounds,
      initialHeading,
      initialZoomLevel,
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
            contentInset={[0, 0, 0, 0]}
            logoEnabled={true}
            onDidFinishRenderingMapFully={this.onDidFinishRenderingMapFully}
            onPress={this.onPress}
            onRegionDidChange={this.onRegionDidChange}
            onRegionIsChanging={this.onRegionIsChanging}
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
              bounds={{
                ne: initialBounds[0], sw: initialBounds[1],
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
              heading={initialHeading}
              zoomLevel={initialZoomLevel}
              ref={camera => { this._camera = camera }}
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
    log.trace('MapArea fitBounds', { neCoords, swCoords, paddingVerticalHorizontal, duration });
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
  async getVisibleBounds(): Promise<BoundsWithHeading> {
    try {
      if (this._map) {
        const mapView = this._map;
        // TODO double casting types until index.d.ts TypeScript declaration is fixed
        const bounds = await mapView.getVisibleBounds() as unknown as BoundsWithHeading;
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

  onRegionIsChanging(args: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) {
    const { isUserInteraction } = args.properties;
    if (isUserInteraction) {
      log.info('onRegionIsChanging', args.geometry.coordinates);
    }
    this.props.mapRegionChanging();
  }

  onRegionDidChange(args: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) {
    const { heading, isUserInteraction, zoomLevel } = args.properties;
    const { visibleBounds } = args.properties as any; // TODO: TS definition is off
    log.trace(`onRegionDidChange bounds: ${visibleBounds} heading: ${heading} zoomLevel: ${zoomLevel}`);
    if (isUserInteraction) {
      this.props.userMovedMap(args.geometry.coordinates as LonLat);
    }
    this.props.mapRegionChanged({ bounds: visibleBounds, heading, zoomLevel });
  }

  onDidFinishRenderingMapFully(...args) {
    log.trace('onDidFinishRenderingMapFully --> mapRendered', args);
    this.props.mapRendered();
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

  zoomTo(zoomLevel: number) {
    if (this._camera) {
      const camera = this._camera!;
      camera.zoomTo(zoomLevel); // TODO options
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
  getVisibleBounds: () => Promise<BoundsWithHeading>;
  getZoom: () => Promise<number>;
  setCamera: (config: object) => void;
  zoomTo: (zoomLevel: number) => void;
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
