import {
  Dimensions,
} from 'react-native';

import {
  // Action,
  appAction,
  newAction,
} from 'lib/actions';

import constants from 'lib/constants';

interface LatLon {
  lat: number;
  lon: number;
}

type Bounds = Array<Array<number>>; // [ [lon, lat] representing NE, [lon, lat] representing SW ]

const utils = {

  // return true if loc is inside bounds.
  // lonInset and latInset of 0 is the simple test.
  // lonInset or latInset > 0 shrinks the range that is considered inside the bounds.
  // lonInset or latInset < 0 expands that range.
  locInsideBounds: (loc: LatLon, bounds: Bounds, lonInset = 0, latInset = 0) => {
    const { lon, lat } = loc;
    const NE = bounds[0];
    const SW = bounds[1];
    return (lon > SW[0] + lonInset && lon < NE[0] - lonInset) &&
      (lat > SW[1] + latInset && lat < NE[1] - latInset)
  },

  // "well bounded" means not just within the bounds, but inside a smaller square contained within the bounds.
  // loc has lon and lat.
  // bounds is like what we get from mapArea.getVisibleBounds: [NE [lon, lat], SW [lon, lat]]
  // Note: NE and SW must be in that order, [ NE, SW ]
  // Hint: read [0] as 'lon' and [1] as 'lat'
  locWellBounded: (loc: LatLon, bounds: Bounds) => {
    const NE = bounds[0]; // NE is [ lon, lat ] of NE corner of bounds
    const SW = bounds[1]; // SW is [ lon, lat ] of SW corner of bounds
    const lonRange = NE[0] - SW[0]; // longitude range of bounds
    const latRange = NE[1] - SW[1]; // latitude range of bounds
    const center = [SW[0] + lonRange / 2,  // lon of center point within bounds
    SW[1] + latRange / 2]; // lat of center point within bounds

    const allowance = Math.min(lonRange / 4, latRange / 4); // allow for a substantial margin around square
    const squareBounds = [[center[0] + allowance, center[1] + allowance],  // NE
    [center[0] - allowance, center[1] - allowance]]; // SW

    return utils.locInsideBounds(loc, squareBounds);
  },

  mapArea: null, // reference to the singleton MapArea component

  objectWithoutKey: (object: any, key: string) => {
    const { [key]: deletedKey, ...otherKeys } = object;
    return otherKeys;
  },

  safeAreaHeight: () => {
    return utils.windowSize().height - (constants.safeAreaBottom + constants.safeAreaTop);
  },

  windowSize: () => {
    const dim = Dimensions.get('window');
    return dim; // { height, width }
  },
}

export default utils;
