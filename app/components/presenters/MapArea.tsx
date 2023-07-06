import React, {
  Component,
} from 'react';

import {
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  CameraSettings,
  RegionPayload,
} from '@rnmapbox/maps';

export interface MapRegionUpdate {
  bounds: LonLat[];
  heading: number;
  zoomLevel: number;
}

import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv'; // deliberately omitted from repo
import Mapbox from '@rnmapbox/maps';
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import { MapAreaProps } from 'containers/MapAreaContainer';
import MapDimmerContainer from 'containers/MapDimmerContainer';
import PathsContainer from 'containers/PathsContainer';
import PulsarsContainer from 'containers/PulsarsContainer';
import { LonLat } from 'lib/locations';
import utils from 'lib/utils';
import log from 'shared/log';

// Public interface to singleton underlying Mapbox component
export type BoundsWithHeading = [LonLat, LonLat, number] | null; // NE, SW, heading

const flexStyle = { flex: 1 };

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
    this.onCameraChanged = this.onCameraChanged.bind(this);
    this.onMapIdle = this.onMapIdle.bind(this);
    this.onPress = this.onPress.bind(this);
    this.setCamera = this.setCamera.bind(this);
    this.zoomTo = this.zoomTo.bind(this);
  }

  componentDidMount() {
    Mapbox.setTelemetryEnabled(false); // TODO review
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
    try {
      utils.addToCount('renderMap');
      const {
        backgroundTapped,
        height,
        initialBounds,
        initialHeading,
        initialZoomLevel,
        mapHidden,
        mapStyleURL,
        timelineHeight,
        width,
      } = this.props;

      const hiddenStyle = {
        height,
      } as any; // as any: https://github.com/Microsoft/TypeScript/issues/18744

      const mapStyle = {
        // alignSelf: 'center',
        height,
        width,
      }
      const viewStyle = {
        height,
      }
      if (mapHidden || !initialBounds || initialBounds[0] === null || initialBounds[1] === null) {
        // TODO this loses map orientation, position, zoom, etc. but on the plus side, it stops consuming resources.
        // onPressIn is instantaneous, unlike onPress which waits for the tap to end.
        return (
          <View style={flexStyle}>
            <TouchableWithoutFeedback
              onPressIn={backgroundTapped}
            >
              <View style={hiddenStyle} />
            </TouchableWithoutFeedback>
          </View>
        )
      }
      // log.trace('initialBounds', initialBounds)
      // TODO contentInset is deprecated
      // Note contentInset must be symmetric (matching inset on top/bottom) in to avoid panning map on hide/show timeline.
      // contentInset={[timelineHeight, 0, timelineHeight, 0]}
      return (
        <View style={flexStyle}>
          <View style={viewStyle}>
            <Mapbox.MapView
              attributionEnabled={true}
              compassEnabled={false}
              logoEnabled={true}
              onPress={this.onPress}
              onMapIdle={this.onMapIdle}
              onCameraChanged={this.onCameraChanged}
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
              {initialBounds ? <Mapbox.Camera
                animationDuration={0}
                followUserLocation={false}
                bounds={{
                  ne: initialBounds[0], sw: initialBounds[1],
                }}
                heading={initialHeading}
                padding={0}
                zoomLevel={initialZoomLevel}
                ref={camera => { this._camera = camera }}
              /> : null}
              <MapDimmerContainer />
              <PathsContainer />
              <PulsarsContainer />
            </Mapbox.MapView>
          </View>
        </View>
      )
    } catch (err) {
      log.error('map render', err);
      return null;
    }
  }

  fitBounds(neCoords: LonLat, swCoords: LonLat, paddingVerticalHorizontal: [number, number], duration: number) {
    try {
      log.trace('MapArea fitBounds', { neCoords, swCoords, paddingVerticalHorizontal, duration });
      if (this._camera) {
        if (!(neCoords[0] === 0 && neCoords[1] === 0 && swCoords[0] === 0 && swCoords[1] === 0)) {
          const camera = this._camera!;
          camera.fitBounds(neCoords, swCoords, paddingVerticalHorizontal, duration);
        }
      }
    } catch (err) {
      log.error('map fitBounds', err);
    }
  }

  // Note the difference between flyTo and moveTo is that flyTo uses Mapbox.CameraModes.Flight.
  flyTo(coordinates: LonLat, duration: number = 0) {
    try {
      if (this._camera) {
        const camera = this._camera!;
        camera.flyTo(coordinates, duration);
      }
    } catch (err) {
      log.error('map flyTo', err);
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
      log.error('map getCenter', err);
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
      log.error('map getPointInView', err);
      return [0, 0]; // TODO should never happen
    }
  }

  // return the coordinate bounds [NE LonLat, SW LonLat] visible in the users’s viewport.
  async getVisibleBounds(): Promise<BoundsWithHeading | null> {
    try {
      if (this._map) {
        const mapView = this._map;
        // TODO double casting types until index.d.ts TypeScript declaration is fixed
        const bounds = await mapView.getVisibleBounds() as unknown as BoundsWithHeading;
        return bounds;
      }
      return null;
    } catch (err) {
      log.error('map getVisibleBounds', err);
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
      log.error('map getZoom', err);
      return 0; // TODO should never happen
    }
  }

  // duration is optional
  moveTo(coordinates: LonLat, duration: number) {
    try {
      if (this._camera) {
        const camera = this._camera!;
        camera.moveTo(coordinates, duration);
      }
    } catch (err) {
      log.error('map moveTo', err);
    }
  }

  onCameraChanged(args: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) {
    try {
      const { isUserInteraction } = args.properties;
      if (isUserInteraction) {
        log.trace('onCameraChanged', args.geometry.coordinates);
      }
      this.props.mapRegionChanging();
    } catch (err) {
      log.error('map onCameraChanged', err);
    }
  }

  onMapIdle(args: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) {
    try {
      const { heading, isUserInteraction, zoomLevel } = args.properties;
      const { visibleBounds } = args.properties as any; // TODO: TS definition is off
      log.trace(`onMapIdle bounds: ${visibleBounds} heading: ${heading} zoomLevel: ${zoomLevel}`);
      this.props.mapRendered();
      if (isUserInteraction) {
        this.props.userMovedMap(args.geometry.coordinates as LonLat);
      }
      if (visibleBounds) {
        this.props.mapRegionChanged({ bounds: visibleBounds, heading, zoomLevel });
      }
    } catch (err) {
      log.error('map onMapIdle', err);
    }
  }

  async onPress(...args) {
    try {
      log.trace('onPress', args);
      this.props.mapTapped(args);
    } catch (err) {
      log.error('map onPress', err);
    }
  }

  setCamera(config: CameraSettings) {
    try {
      if (this._camera) {
        const camera = this._camera!;
        camera.setCamera(config);
      }
    } catch (err) {
      log.error('map setCamera', err);
    }
  }

  zoomTo(zoomLevel: number) {
    try {
      if (this._camera) {
        const camera = this._camera!;
        camera.zoomTo(zoomLevel); // TODO options
      }
    } catch (err) {
      log.error('map zoomTo', err);
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
  setCamera: (config: CameraSettings) => void;
  zoomTo: (zoomLevel: number) => void;
}

// ref to singleton MapArea component that is created
// TODO this seems cumbersome - seek a simpler way
let singletonMap: (Component<MapAreaProps> & IMapUtils) | null = null;

export function MapUtils(): IMapUtils | null {
  if (!singletonMap || !singletonMap.getMap) {
    return null; // TODO
  }
  return singletonMap.getMap();
}

export default MapArea;
