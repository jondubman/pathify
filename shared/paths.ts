import Realm from 'realm';

// import log from './log';

export const PathSchema: Realm.ObjectSchema = { // Note: keep Activity and ActivityData in sync, below!
  name: 'Path',
  primaryKey: 'id',
  properties: {
    id: 'string',
    lats: 'double[]',
    lons: 'double[]',
  },
}

export interface Path extends Realm.Object {
  id: string; // should match id of corresponding Activity
  lats: number[]; // required, may be empty, should have same length as pathLons
  lons: number[]; // required, may be empty
}

export interface PathUpdate {
  id: string; // should match id of corresponding Activity
  lats: number[]; // required, may be empty, should have same length as pathLons
  lons: number[]; // required, may be empty
}
