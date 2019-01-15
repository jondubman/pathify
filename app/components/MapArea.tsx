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
import { LocationEvent } from 'lib/geo';
import log from 'lib/log';
import store from 'lib/store';

import FollowMeButtonContainer from 'containers/FollowMeButtonContainer';
import Pulsar from 'components/presenters/Pulsar';

interface Props {
  height: number;
  mapStyleURL: string;
  opacity: number;
  width: number;
  userLoc?: LocationEvent;
}

// Public interface to singleton underlying Mapbox component
export interface IMapUtils {
  flyTo: Function;
  getVisibleBounds: Function;
}

let singletonMap: (Component<Props> | null) = null; // a reference to the singleton MapArea component that is created

export function MapUtils(): IMapUtils  {
  if (!singletonMap) {
    return null as any; // TODO
  }
  return (singletonMap as any).getMap();
}

// For now this is intended to be a singleton component. TODO enforce via ref function.

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
  }

  getMap(): IMapUtils {
    return { // methods exposed for imperative use as needed
      flyTo: this.flyTo,
      getVisibleBounds: this.getVisibleBounds,
    }
  }

  render() {
    const { height, mapStyleURL, opacity, width, userLoc } = this.props;
    const mapStyle = {
      alignSelf: 'center',
      height,
      width,
    } as any;
    const mapCenterLon = constants.map.default.lon;
    const mapCenterLat = constants.map.default.lat;

    const showUserMarker = !!userLoc; // boolean (related to use of userLoc! postfix bang for non-null assertion below)

    return (
      <View style={{ opacity }}>
        <Mapbox.MapView
          attributionEnabled={true}
          centerCoordinate={[ mapCenterLon, mapCenterLat ]}
          contentInset={[ 0, 0, 0, 0 ]}
          heading={0}
          logoEnabled={false}
          compassEnabled={false}
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
              lon={userLoc!.lon}
              lat={userLoc!.lat}
              color={constants.colors.user}
            />
            :
            null
          }
        </Mapbox.MapView>
        <FollowMeButtonContainer />
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
      return await mapView.getVisibleBounds();
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
    log.debug('onRegionWillChange', args);

    // Detect if user panned the map, as in https://github.com/mapbox/react-native-mapbox-gl/issues/1079
    if (args[0].properties.isUserInteraction) {
      store.dispatch(newAction(appAction.USER_MOVED_MAP));
    }
  }

  onRegionDidChange(...args) {
    log.trace('onRegionDidChange', args);
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
