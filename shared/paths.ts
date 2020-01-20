import Realm from 'realm';

export const PathSchema: Realm.ObjectSchema = { // Note: keep PathSchema and Path in sync, below!
  name: 'Path',
  primaryKey: 'id',
  properties: {
    id: 'string',
    // ele: 'int[]',
    lats: 'double[]',
    lons: 'double[]',
    // t: 'int[]',
  },
}

export interface Path extends PathUpdate, Realm.Object {
}

export interface PathUpdate {
  id: string; // should match id of corresponding Activity
  // ele: 'number[]';
  lats: number[]; // required, may be empty, should have same length as lons
  lons: number[]; // required, may be empty
  // t: number[];
}
