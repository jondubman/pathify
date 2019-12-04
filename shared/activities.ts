// Shared code (client + server) to support activities that collect events that occur between START and STOP actions.
import Realm from 'realm';

import log from './log';
import { Timepoint } from './timeseries';
import { metersToMiles, msecToString } from './units';

// TODO the repetition here is not ideal, particularly between Activity and ActivityData.

export const ActivitySchema: Realm.ObjectSchema = { // Note: keep Activity and ActivityData in sync, below!
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

export interface Activity extends Realm.Object { // returned from Realm, resembles ordinary Object, but isn't
  id: string; // use matching activityId for corresponding START and END marks and events collected between

  odoStart: number; // odo of the earliest location in the activity
  pathLons: number[]; // required, may be empty
  pathLats: number[]; // required, may be empty, should have same length as pathLons
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
}
export type Activities = Activity[];

// ActivityData facilitate creating and updating Activities and they are also used to populate the cache in Redux.
// All the Activity properties above are included, without extending Realm.Object. Here, all but id are optional.
export interface ActivityData {
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

export interface ActivityDataExtended extends ActivityData { // these are the 'Extended' properties:
  distance?: number;
  distanceMiles?: number;
  latMax?: number;
  latMin?: number;
  lonMax?: number;
  lonMin?: number;
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
    a.tStartText = new Date(a.tStart).toLocaleString()
    const tEnd = a.tEnd || a.tLastLoc || a.tLastUpdate;
    if (tEnd) {
      a.tTotal = tEnd - a.tStart;
      a.tTotalText = msecToString(a.tTotal);
    }
    // compute bounds
    a.latMax = -Infinity;
    a.latMin = Infinity;
    a.lonMax = -Infinity;
    a.lonMin = Infinity;
    if (a.pathLats && a.pathLons) {
      const length = a.pathLats.length;
      if (length === a.pathLons.length) { // these should really match, but...
        for (let i = 0; i < length; i++) {
          const lat = a.pathLats[i];
          const lon = a.pathLons[i];
          a.latMax = Math.max(a.latMax, lat);
          a.latMin = Math.min(a.latMin, lat);
          a.lonMax = Math.max(a.lonMax, lon);
          a.lonMin = Math.min(a.lonMin, lon);
        }
      }
    }
  } catch (err) {
    log.warn('extendActivity', err);
  }
  return a;
}

export const loggableActivity = (activity: Activity): any => {
  const a = { ...extendActivity(activity) } as any; // any, so we can replace pathLats and pathLons with just a length,
  a.pathLats = a.pathLats.length; // blasting away all the individual points,
  a.pathLons = a.pathLons.length; // which we don't want cluttering up a log.
  return a;
}
