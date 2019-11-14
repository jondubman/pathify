// Shared code (client + server) to support activities that collect events that occur between START and STOP actions.
import Realm from 'realm';

import { Timepoint } from './timeseries';
import { metersToMiles, msecToString } from './units';

// TODO the repetition here is not ideal, particularly between Activity and ActivityUpdate.

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
    maxGapTime: 'int?',
    tMaxGapTime: 'int?',

    odo: 'int?', // total distance
    maxGapDistance: 'int?',
    tMaxGapDistance: 'int?',

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
  count?: number; // of events

  maxGapTime?: number; // msec
  tMaxGapTime?: number; //timestamp

  odo?: number; // total distance
  maxGapDistance?: number; // meters
  tMaxGapDistance?: number; // timestamp

  gain?: number; // total elevation gain
  loss?: number; // total elevation loss
}
export type Activities = Activity[];

export interface ActivityUpdate { // also used to create. Note this is same as above but does not extend Realm.Object.
  // id required
  id: string; // use matching activityId for corresponding START and END marks and events collected between

  // All others optional: (TODO should be same properties as in Activity above, but all are optional)
  odoStart?: number;
  pathLons?: number[];
  pathLats?: number[];
  tLastLoc?: Timepoint;
  tLastUpdate?: Timepoint;
  tStart?: number;
  tEnd?: number;

  // metrics
  count?: number; // of events

  maxGapTime?: number; // msec
  tMaxGapTime?: number; //timestamp

  odo?: number; // total distance
  maxGapDistance?: number; // meters
  tMaxGapDistance?: number; // timestamp

  gain?: number; // total elevation gain
  loss?: number; // total elevation loss
}

export const loggableActivity = (activity: Activity) => {
  let a = { ...activity } as any; // Adorn the provided activity with additional fields
  a.pathLats = a.pathLats.length; // Return just the array length rather than all the
  a.pathLons = a.pathLons.length; // individual points.
  if (a.odo && a.odoStart) {
    a.distance = a.odo - a.odoStart;
    a.distanceMiles = metersToMiles(a.distance);
  }
  a.tStartText = new Date(a.tStart).toLocaleString()
  const tEnd = a.tEnd || a.tLastLoc || a.tLastUpdate;
  if (tEnd) {
    a.tTotal = tEnd - a.tStart;
    a.tTotalText = msecToString(a.tTotal);
  }
  return a;
}
