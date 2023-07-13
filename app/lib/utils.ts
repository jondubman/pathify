import {
  AppState as RNAppState, // Rename built-in AppState; would rather use AppState to refer to our Redux application state
  Dimensions,
} from 'react-native';
import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';
import * as turf from '@turf/turf';

import constants from 'lib/constants';
import { LonLat } from 'lib/locations';

// export type Bounds = Array<Array<number>>; // [ [lon, lat] representing NE, [lon, lat] representing SW ]
export type Bounds = LonLat[];

// Counts (e.g. render counts) are stored here privately rather than in the Redux store for simplicity/efficiency.
// It would be unhelpful for counting to yield any additional chatter between react-redux and the stuff we're measuring.
const _counts: any = {};
let _testMode = false;

const utils = {

  addToCount: (prop: string, increment: number = 1): void => {
    if (!_counts[prop]) {
      _counts[prop] = 0;
    }
    _counts[prop] += increment;
  },

  appInBackground: (): boolean => (
    (RNAppState.currentState === 'background')
  ),

  bottomPaddingForAxis: () => (
    StaticSafeAreaInsets.safeAreaInsetsBottom ? 28 : 14 // empirically optimized for displays with/without home button
  ),

  boundsContained: (a: Bounds, b: Bounds): boolean => ( // Is a contained in b?
    utils.locInsideBounds(a[0], b) && utils.locInsideBounds(a[1], b)
  ),

  boundsOverlap: (a: Bounds, b: Bounds): boolean => (
    utils.locInsideBounds(a[0], b) || // NE corner of a inside b
    utils.locInsideBounds(a[1], b) || // SW corner of a inside b
    utils.locInsideBounds(b[0], a) || // NE corner of b inside a
    utils.locInsideBounds(b[1], a)    // SW corner of b inside a
  ),

  centerForBounds: (bounds: Bounds): LonLat | undefined => {
    const NE = bounds[0];
    const SW = bounds[1];
    const features = turf.featureCollection([turf.point(NE), turf.point(SW)]);
    const point = turf.center(features) as turf.Feature<turf.Point>;
    if (!point || !point.geometry || !point.geometry.coordinates) {
      return undefined;
    }
    return point.geometry.coordinates as LonLat;
    // Old way, before using turf
    // return [ (NE[0] + SW[0]) / 2,
    //          (NE[1] + SW[1]) / 2];
  },

  counts: (): any => {
    return _counts;
  },

  // not currently used
  deepCopy: (obj: Object): Object => (
    JSON.parse(JSON.stringify(obj))
  ),

  // used for debugging
  displayTimestamp: (t: number) => (
    `${(new Date(t)).toDateString()} ` +
    `${(new Date(t)).toTimeString().split(' ')[0]}:${t.toString().slice(t.toString().length - 4, t.toString().length)}`
  ),
  
  // Return true if given LonLat is valid
  haveLonLat: (loc: LonLat | null | undefined): boolean => (
      loc !== null && loc !== undefined && (!!loc[0] || loc[0] === 0) && (!!loc[1] || loc[1] === 0)
  ),

  // Return true if given loc is inside given bounds, thus:
  // lonInset and latInset of 0 yield the simplest containment test.
  // lonInset or latInset > 0 shrinks the range that is considered 'inside' the bounds.
  // lonInset or latInset < 0 expands that range.
  locInsideBounds: (loc: LonLat, bounds: Bounds, lonInset = 0, latInset = 0): boolean => {
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
  locWellBounded: (loc: LonLat, bounds: Bounds): boolean => {
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
    const squareBounds: Bounds = [[center[0] + allowance, center[1] + allowance],  // NE
                                 [center[0] - allowance, center[1] - allowance]]; // SW
    return utils.locInsideBounds(loc, squareBounds);
  },

  mapArea: null, // reference to the singleton MapArea component

  now: () => {
    return _testMode ? (
      new Date((new Date).setHours(9, 41)).getTime()
    ) : (Date.now());
  },

  // not currently used
  objectWithoutKey: (object: any, key: string) => {
    const { [key]: deletedKey, ...otherKeys } = object;
    return otherKeys;
  },

  precisionRound: (num: number, precision: number) => {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  },

  safeAreaBottom: () => (
    StaticSafeAreaInsets.safeAreaInsetsBottom
  ),

  safeAreaTop: () => (
    StaticSafeAreaInsets.safeAreaInsetsTop
  ),

  setTestMode: (testMode: boolean) => {
    _testMode = testMode; 
  },

  floorTime: (t: number) => (Math.floor(t / 1000) * 1000),
  roundTime: (t: number) => (Math.round(t / 1000) * 1000),
  ceilTime: (t: number) => (Math.ceil(t / 1000) * 1000),

  twoDigitString: (n: number) => {
    if (!n) return '00';
    if (n < 10) return '0' + n;
    return n.toString();
  },

  // iPhone logical widths are
  // 320 = iPhone SE 1st gen = constants.minDeviceWidth
  // 360 = iPhone 12 mini
  // 375 = iPhone 11 Pro
  // 390 = iPhone 12
  // 414 = iPhone 11, iPhone 11 Pro Max
  // 428 = iPhone 12 Pro Max
  //
  // iPhone logical heights are
  // 568 = iPhone SE 1st gen = constants.minDeviceHeight
  // 667 = iPhone SE 2nd gen, iPhone 8
  // 736 = iPhone 8 Plus
  // 780 = iPhone 12 mini
  // 812 = iPhone 11 Pro
  // 844 = iPhone 12
  // 896 = iPhone 11 Pro Max
  // 926 = iPhone 12 Pro Max
  //
  // https://ios-resolution.com

  windowHeightFactor: () => utils.windowHeight() / constants.minDeviceHeight,
  windowWidthFactor: () => utils.windowWidth() / constants.minDeviceWidth,

  windowHeight: () => {
    const dim = Dimensions.get('window');
    return dim.height;
  },

  windowSize: () => {
    const dim = Dimensions.get('window');
    return dim; // { height, width }
  },

  windowWidth: () => {
    const dim = Dimensions.get('window');
    return dim.width;
  },
}

export default utils;
