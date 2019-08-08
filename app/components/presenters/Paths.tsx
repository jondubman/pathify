// This renders a number of Path components at once, to be contained within a MapArea.

import React, {
  Component,
  Fragment,
} from 'react';

import Mapbox from '@mapbox/react-native-mapbox-gl';

import { PathsProps } from 'containers/PathsContainer';
import constants from 'lib/constants';
import { Path, PathSegment, PathType } from 'shared/locations';

const lineLayerStyleBase = {
  // lineCap: 'round', // TODO
  // lineDasharray: [1, 1],
  // lineJoin: 'round', // TODO
  lineWidth: constants.paths.width,
  lineOpacity: 1,
}

const lineLayerStyleDefault = Mapbox.StyleSheet.create({
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.default,
})

const lineLayerStyleCurrent = Mapbox.StyleSheet.create({
  ...lineLayerStyleBase,
  lineColor: constants.colors.paths.current,
})

class Paths extends Component<PathsProps> {
  public render() {
    const { paths } = this.props;
    if (!paths.length) {
      return null;
    }
    return (
      <Fragment>
        {paths.map((path: Path, pathIndex: number) => (
          path.segments.map((segment: PathSegment, segmentIndex: number) => {
            const index = `${pathIndex}.${segmentIndex}`;
            if (segment.coordinates.length < 2) {
              return null; // need at least one path segment to draw
            }
            const pathShape = {
              type: 'Feature',
              properties: {
                name: `path${index}`,
              },
              geometry: {
                type: 'LineString',
                coordinates: segment.coordinates,
              },
            }
            return (
              <Mapbox.ShapeSource id={`pathShape${index}`} key={`pathShape${index}`} shape={pathShape}>
                <Mapbox.LineLayer
                  id={`path${index}`}
                  key={`path${index}`}
                  style={(path.type === PathType.CURRENT) ? lineLayerStyleCurrent : lineLayerStyleDefault}
                />
              </Mapbox.ShapeSource>
            )
          })
        ))}
      </Fragment>
    )
  }
}

export default Paths;
