// This renders a number of Path components at once, to be contained within a MapArea.

import React, {
  PureComponent,
  Fragment,
} from 'react';

import Mapbox from '@react-native-mapbox-gl/maps';

import { PathsProps } from 'containers/PathsContainer';
import constants from 'lib/constants';
import { LonLat } from 'lib/locations';
import log from 'shared/log';

const lineLayerStyleBase = {
  // lineCap: 'round',
  // lineDasharray: [1, 1],
  // lineJoin: 'round',
  lineWidth: constants.paths.width,
  lineOpacity: 1,
}

const lineLayerStyleCurrent = {
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.current,
}

const lineLayerStyleOther = {
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.other,
}

const lineLayerStyleSelected = {
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.selected,
}

class Paths extends PureComponent<PathsProps> {

  render() {
    const { currentActivityId, paths, selectedActivityId } = this.props;
    const shapes = [] as JSX.Element[]; // accumulates Mapbox.ShapeSource components

    for (let a = 0; a < paths.length; a++) {
      const path = paths[a];
      if (!path) {
        continue;
      }
      const { id, lons, lats } = path;
      try {
        if (!lats || !lons || !lats.length || !lons.length || lats.length != lons.length) {
          continue;
        }
        const length = lats.length;
        if (length < 2) {
          continue;  // need at least one path segment to draw
        }
        let coordinates = [] as LonLat[];
        for (let i = 0; i < length; i++) {
          const lonLat = [lons[i], lats[i]] as LonLat;
          coordinates.push(lonLat);
        }
        const pathShape: GeoJSON.Feature = { // note GeoJSON is a TS namespace
          type: 'Feature',
          properties: {
            name: `pathId${id}`,
          },
          geometry: {
            type: 'LineString',
            coordinates,
          },
        }
        const key = `pathShape${id}-${lats.length}`;
        let lineStyle = lineLayerStyleOther;
        if (id === currentActivityId) {
          lineStyle = lineLayerStyleCurrent
        } else if (id === selectedActivityId) {
          lineStyle = lineLayerStyleSelected
        }
        shapes.push(
          <Mapbox.ShapeSource id={`pathShape${id}`} key={key} shape={pathShape}>
            <Mapbox.LineLayer
              id={`path${id}`}
              key={`path${id}`}
              style={lineStyle}
            />
          </Mapbox.ShapeSource>
        )
      } catch (err) {
        log.error('Paths render', id, err);
      }
    }
    return (
      <Fragment>
        {shapes.map((shape: JSX.Element) => shape)}
      </Fragment>
    )
  }
}

export default Paths;
