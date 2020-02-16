import Realm from 'realm';

export const PathSchema: Realm.ObjectSchema = { // Note: keep PathSchema and Path in sync, below!
  name: 'Path',
  primaryKey: 'id',
  properties: {
    id: 'string',
    ele: 'int[]',
    lats: 'double[]',
    lons: 'double[]',
    mode: 'int[]',
    odo: 'int[]', // meters, so it can be an int
    schemaVersion: 'int',
    speed: 'double[]',
    t: 'int[]', // msec
  },
}

export interface Path extends PathUpdate, Realm.Object {
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
