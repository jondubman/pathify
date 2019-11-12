// Shared code (client + server) to support activities that collect events that occur between START and STOP actions.
import Realm from 'realm';

import { Timepoint } from './timeseries';

export const ActivitySchema: Realm.ObjectSchema = { // Note: keep Activity and ActivityUpdate in sync, below!
  name: 'Activity',
  primaryKey: 'id',
  properties: {
    id: 'string',
    odoStart: 'int?',
    pathLons: 'double[]',
    pathLats: 'double[]',
    tLastLoc: 'int?',
    tLastUpdate: { type: 'int', indexed: true },
    tStart: { type: 'int', indexed: true },
    tEnd: { type: 'int', indexed: true },

    // metrics
    count: 'int', // of events
    odo: 'int?', // total distance
    gain: 'int?', // total elevation gain
    loss: 'int?', // total elevation loss
  },
}

export interface Activity extends Realm.Object { // returned from Realm
  id: string; // use matching activityId for corresponding START and END marks and events collected between

  odoStart: number; // odo of the earliest location in the activity
  pathLons: number[];
  pathLats: number[];
  tLastLoc?: Timepoint;
  tLastUpdate: Timepoint;
  tStart: Timepoint;
  tEnd: Timepoint;

  // metrics
  count: number; // of events
  odo: number; // activity distance (like a trip odometer)
  gain: number; // total elevation gain
  loss: number; // total elevation loss
}
export type Activities = Activity[];

export interface ActivityUpdate { // also used to create. Note this does not extend Realm.Object.
  // id required
  id: string; // use matching activityId for corresponding START and END marks and events collected between

  // All others optional: (TODO should be same properties as in Activity above, but optional)
  odoStart?: number;
  pathLons?: number[];
  pathLats?: number[];
  tLastLoc?: Timepoint;
  tLastUpdate?: Timepoint;
  tStart?: number;
  tEnd?: number;

  // metrics
  count?: number; // of events
  odo?: number; // total distance
  gain?: number; // total elevation gain
  loss?: number; // total elevation loss
}

export const loggableActivity = (activity: Activity) => {
  let modified = { ...activity } as any;
  modified.pathLats = modified.pathLats.length; // Return just the array length rather than all the
  modified.pathLons = modified.pathLons.length; // individual points.
  // TODO4 longest gaps
  return modified;
}
