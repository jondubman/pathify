// This renders a number of Path components at once.
// Intended to be contained within a MapArea.

import React, {
  Component,
  Fragment,
} from 'react';

import Mapbox from '@mapbox/react-native-mapbox-gl';

import { PathsProps } from 'containers/PathsContainer';
import constants from 'lib/constants';
import { Path } from 'shared/locations';

const lineLayerStyle = Mapbox.StyleSheet.create({
  // lineCap: 'round', // TODO
  lineColor: constants.colors.byName.blue,
  // lineDasharray: [1, 1],
  // lineJoin: 'round', // TODO
  lineWidth: 10, // TODO constants
  lineOpacity: 1,
})

class Paths extends Component<PathsProps> {
  public render() {
    const { paths } = this.props;
    if (!paths.length) {
      return null;
    }
    return (
      <Fragment>
        {paths.map((path: Path, index: number) => {
          if (path.coordinates.length < 2) {
            return null;
          }
          const pathShape = {
            type: 'Feature',
            properties: {
              name: `path${index}`,
            },
            geometry: {
              type: 'LineString',
              coordinates: path.coordinates,
            },
          }
          return (
            <Mapbox.ShapeSource id={`pathShape${index}`} key={`pathShape${index}`} shape={pathShape}>
              <Mapbox.LineLayer
                id={`path${index}`}
                key={`path${index}`}
                style={lineLayerStyle}
              />
            </Mapbox.ShapeSource>
          )
        })}
      </Fragment>
    )
  }
}

export default Paths;
