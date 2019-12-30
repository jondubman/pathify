// Shared code (client + server) to support activities that collect events that occur between START and STOP actions.
import Realm from 'realm';

import log from './log';
import { Timepoint } from './timeseries';
import { metersToMiles, msecToString } from './units';

export const ActivitySchema: Realm.ObjectSchema = { // Note: keep Activity and ActivityData in sync, below!
  name: 'Activity',
  primaryKey: 'id',
  properties: {
    id: 'string',
    schemaVersion: 'int',
    odoStart: 'int?',
    tLastLoc: 'int?',
    tLastUpdate: { type: 'int', indexed: true },
    tStart: { type: 'int', indexed: true },
    tEnd: { type: 'int', indexed: true },

    // metrics
    count: 'int', // of events
    maxGapTime: 'int?',
    tMaxGapTime: 'int?',

    odo: 'int?', // total distance (meters, so OK that it's an int)
    maxGapDistance: 'int?',
    tMaxGapDistance: 'int?',

    gain: 'int?', // total elevation gain
    loss: 'int?', // total elevation loss

    // bounds
    latMax: 'double?',
    latMin: 'double?',
    lonMax: 'double?',
    lonMin: 'double?',
  },
}

export interface Activity extends Realm.Object { // returned from Realm, resembles ordinary Object, but isn't
  id: string; // use matching activityId for corresponding START and END marks and events collected between
  schemaVersion: number;

  odoStart: number; // odo of the earliest location in the activity
  tLastLoc?: Timepoint; // optional
  tLastUpdate: Timepoint; // required
  tStart: Timepoint; // required
  tEnd: Timepoint; // required

  // metrics
  count?: number; // of events

  maxGapTime?: number; // msec
  tMaxGapTime?: number; //timestamp

  odo?: number; // total distance
  maxGapDistance?: number; // meters
  tMaxGapDistance?: number; // timestamp

  gain?: number; // total elevation gain
  loss?: number; // total elevation loss

  // bounds
  latMax?: number;
  latMin?: number;
  lonMax?: number;
  lonMin?: number;
}
export type Activities = Activity[];

// ActivityData facilitate creating and updating Activities.
// All the Activity properties above are included, without extending Realm.Object. Here, all but id are optional.
export interface ActivityData {
  // id required
  id: string; // use matching activityId for corresponding START and END marks and events collected between
  schemaVersion: number;

  // All others optional: (TODO should be same properties as in Activity above, but all are optional)
  odoStart?: number;
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

  // bounds
  latMax?: number;
  latMin?: number;
  lonMax?: number;
  lonMin?: number;
}

// ActivityDataExtended populate the activities cache in Redux store, and appear on the ActivityList.
export interface ActivityDataExtended extends ActivityData { // these are the 'Extended' properties:
  distance?: number;
  distanceMiles?: number;
  tStartText?: string;
  tTotal?: number;
  tTotalText?: string;
}

export const extendedActivities = (activities: ActivityData[]) => {
  return activities.map((activityData) => extendActivity(activityData));
}

export const extendActivity = (activity: ActivityData): ActivityDataExtended => {
  const a = { ...activity } as ActivityDataExtended;
  try {
    if (a.odo && a.odoStart) {
      a.distance = a.odo - a.odoStart;
      a.distanceMiles = metersToMiles(a.distance);
    }
    if (a.tStart) {
      a.tStartText = new Date(a.tStart).toLocaleString()
      const tEnd = a.tEnd || a.tLastLoc || a.tLastUpdate;
      if (tEnd) {
        a.tTotal = tEnd - a.tStart;
        a.tTotalText = msecToString(a.tTotal);
      }
    }
  } catch (err) {
    log.warn('extendActivity', err);
  }
  return a;
}

export const loggableActivity = (activity: Activity) => {
  return extendActivity(activity);
}
