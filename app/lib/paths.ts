import Realm from 'realm';

// Paths, like Activities, are derived from raw events, existing primarily for performance reasons.
// Paths are persisted in Realm, but are not cached in the Redux store, as the corresponding Activities are.
// Thus, exporting all the activities with the paths would require reading and processing heaps of data from Realm DB,
// which will consume noticeable time and energy if there are lots of activities.
// The Activities are small amounts of data very frequently accessed and the paths are somewhat frequently accessed.
// The events that inform all these are probably rarely accessed. They're somewhat redundant raw data that may prove
// vital for feature enhancements.

// The array properties of Paths are aligned by index and each must be the same length.
// The timestamp corresponding to each index is stored in the t array. So:
//    path[0].t is the timestamp of the first path update.
//    path[0].odo is the odometer reading of the first path update, at time path[0].t., et cetera.
// As a result, for any given Activity, it's fast and easy to construct any time-series based on path info at runtime.

export const PathSchema: Realm.ObjectSchema = { // Note: properties must stay in sync with those of PathUpdate!
  name: 'Path',
  primaryKey: 'id',
  properties: {
    id: 'string', // should match id of corresponding Activity
    ele: 'int[]', // elevations in meters
    lats: 'double[]', // latitudes
    lons: 'double[]', // longitudes
    mode: 'int[]', // see EventType
    odo: 'int[]', // meters, so it can be an int
    schemaVersion: 'int',
    speed: 'double[]', // meters per second
    t: 'int[]', // timestamp in msec
  },
}

// Note: All these arrays are supposed to have the same number of elements!

export interface PathUpdate { // does not extend Realm.Object
  id: string; // should match id of corresponding Activity
  ele: number[]; // elevations in meters
  lats: number[]; // required, may be empty, same length as lons
  lons: number[]; // required, may be empty, same length as lats
  mode: number[]; // travel mode
  odo: number[]; // odometer, as in distance
  schemaVersion: number; // in case we need to migrate the data down the line
  speed: number[]; // meters per second
  t: number[]; // timestamp in msec
}

export interface Path extends PathUpdate, Realm.Object { /* nothing else added */ }
