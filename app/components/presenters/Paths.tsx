// This renders a number of Path components at once, to be contained within a MapArea.

import React, {
  PureComponent,
  Fragment,
} from 'react';

import Mapbox from '@react-native-mapbox-gl/maps';

import { PathsProps } from 'containers/PathsContainer';
import constants from 'lib/constants';
import { LonLat } from 'shared/locations';
import log from 'shared/log';

const lineLayerStyleBase = {
  // lineCap: 'round',
  // lineDasharray: [1, 1],
  // lineJoin: 'round',
  lineWidth: constants.paths.width,
  lineOpacity: 1,
}

const lineLayerStyleDefault = {
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.default,
}

const lineLayerStyleCurrent = {
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.current,
}

class Paths extends PureComponent<PathsProps> {

  render() {
    const { activities, currentActivityId } = this.props;
    let shapes = [] as JSX.Element[];
    for (let a = 0; a < activities.length; a++) {
      const activity = activities[a];
      if (!activity) {
        continue;
      }
      const { pathLons, pathLats } = activity;
      try {
        if (!pathLats || !pathLons || !pathLats.length || !pathLons.length || pathLats.length != pathLons.length) {
          continue;
        }
        const length = pathLats.length;
        if (length < 2) {
          continue;  // need at least one path segment to draw
        }
        let coordinates = [] as LonLat[];
        for (let i = 0; i < length; i++) {
          const lonLat = [pathLons[i], pathLats[i]] as LonLat;
          coordinates.push(lonLat);
        }
        const pathId = activity.tStart;
        const pathShape = {
          type: 'Feature',
          properties: {
            name: `pathStarting${pathId}`,
          },
          geometry: {
            type: 'LineString',
            coordinates,
          },
        }
        shapes.push(
          <Mapbox.ShapeSource id={`pathShape${pathId}`} key={`pathShape${pathId}`} shape={pathShape}>
            <Mapbox.LineLayer
              id={`path${pathId}`}
              key={`path${pathId}`}
              style={activity.id === currentActivityId ? lineLayerStyleCurrent : lineLayerStyleDefault}
            />
          </Mapbox.ShapeSource>
        )
      } catch (err) {
        log.error('Paths render', activity, err);
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

//                 style={(activity.pathType === PathType.CURRENT) ? lineLayerStyleCurrent : lineLayerStyleDefault}
