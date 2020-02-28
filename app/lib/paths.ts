import Realm from 'realm';

// Paths, like Activities, are derived from raw events, primarily for performance reasons.
// Paths are persisted in Realm, but are not cached in the Redux store, as the corresponding Activities are.
// The Activities are small amounts of data very frequently accessed and the paths are somewhat frequently accessed.
// The events that inform all these are probably rarely accessed.

// The array properties of Paths are aligned by index and each must be the same length.
// The timestamp corresponding to each index is stored in the t array. So:
//    path[0].t is the timestamp of the first path update.
//    path[0].odo is the odometer reading of the first path update, at time path[0].t.
// As a result, for any given Activity, it's fast and easy to construct any time-series based on path info at runtime.

export const PathSchema: Realm.ObjectSchema = { // Note: keep PathSchema and Path in sync, below!
  name: 'Path',
  primaryKey: 'id',
  properties: {
    id: 'string', // should match id of corresponding Activity
    ele: 'int[]', // elevation
    lats: 'double[]', // latitudes
    lons: 'double[]', // longitudes
    mode: 'int[]', // see EventType
    odo: 'int[]', // meters, so it can be an int
    schemaVersion: 'int',
    speed: 'double[]', // meters per second
    t: 'int[]', // msec
  },
}

export interface PathUpdate {
  id: string; // should match id of corresponding Activity
  ele: number[];
  lats: number[]; // required, may be empty, should have same length as lons
  lons: number[]; // required, may be empty
  mode: number[];
  odo: number[];
  schemaVersion: number;
  speed: number[];
  t: number[];
}

export interface Path extends PathUpdate, Realm.Object { /* nothing else added */ }
