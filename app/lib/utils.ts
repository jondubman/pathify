import {
  Dimensions,
} from 'react-native';

import { LonLat } from 'shared/locations';

type Bounds = Array<Array<number>>; // [ [lon, lat] representing NE, [lon, lat] representing SW ]

const utils = {

  deepCopy: (obj: Object): Object => (
    JSON.parse(JSON.stringify(obj))
  ),

  // return true if loc is inside bounds.
  // lonInset and latInset of 0 is the simple test.
  // lonInset or latInset > 0 shrinks the range that is considered inside the bounds.
  // lonInset or latInset < 0 expands that range.
  locInsideBounds: (loc: LonLat, bounds: Bounds, lonInset = 0, latInset = 0) => {
    const lon = loc[0];
    const lat = loc[1];
    const NE = bounds[0];
    const SW = bounds[1];
    return (lon > SW[0] + lonInset && lon < NE[0] - lonInset) &&
      (lat > SW[1] + latInset && lat < NE[1] - latInset)
  },

  // locWellBounded helps ensure content is shown on the map.
  // "well bounded" means not just within the given bounds, but inside a smaller square enclosed within those bounds.
  // The idea is to include some margin around the area of concern to provide context. loc has lon and lat.
  // bounds is like what we get from mapArea.getVisibleBounds: [NE [lon, lat], SW [lon, lat]]
  // Note: NE and SW must be in that order, [NE, SW]
  // Hint: read [0] as 'lon' and [1] as 'lat'
  locWellBounded: (loc: LonLat, bounds: Bounds) => {
    const NE = bounds[0]; // NE is [lon, lat] of NE corner of bounds
    const SW = bounds[1]; // SW is [lon, lat] of SW corner of bounds
    const lonRange = NE[0] - SW[0]; // longitude range of bounds
    const latRange = NE[1] - SW[1]; // latitude range of bounds
    const center = [SW[0] + lonRange / 2,  // lon of center point within bounds
                    SW[1] + latRange / 2]; // lat of center point within bounds

    // TODO dividing the ranges by 4 means total horizontal and vertical allowances are 1/2 that of the square.
    // (top, bottom, left, right). This could be adjusted up or down, or there could be separately controllable margins.
    // If allowance is 0, the center may end up on the edge of the bounds, with zero context on one side.
    const allowance = Math.min(lonRange / 4, latRange / 4); // allow for a substantial margin around square
    const squareBounds = [[center[0] + allowance, center[1] + allowance],  // NE
                          [center[0] - allowance, center[1] - allowance]]; // SW
    return utils.locInsideBounds(loc, squareBounds);
  },

  mapArea: null, // reference to the singleton MapArea component

  now: () => (Date.now()), // TODO allow the app's concept of the current time to be simulated, or real (this is real)

  objectWithoutKey: (object: any, key: string) => {
    const { [key]: deletedKey, ...otherKeys } = object;
    return otherKeys;
  },

  precisionRound: (num: number, precision: number) => {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  },

  twoDigitString: (n: number) => {
    if (!n) return '00';
    if (n < 10) return '0' + n;
    return n.toString();
  },

  windowSize: () => {
    const dim = Dimensions.get('window');
    return dim; // { height, width }
  },
}

export default utils;
