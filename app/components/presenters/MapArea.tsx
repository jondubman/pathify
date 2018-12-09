import React, {
  Component,
} from 'react';

import {
  View,
} from 'react-native';

import Mapbox from '@mapbox/react-native-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from 'react-native-dotenv';
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

import constants from 'lib/constants';
import utils from 'lib/utils';

interface Props extends React.Props<any> {
  mapStyleURL: string,
  opacity: number,
}

class MapArea extends Component<Props> {
  render() {
    const { mapStyleURL, opacity } = this.props;
    const { height, width } = utils.windowSize();
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
}

export default MapArea;
