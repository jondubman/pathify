import Realm from 'realm';

import database from 'lib/database';
import { PathUpdate } from 'lib/paths';
import { Timepoint } from 'lib/timeseries';
import {
  metersToMiles,
  msecToTimeString,
} from 'lib/units';
import utils from 'lib/utils';
import log from 'shared/log';

export const ActivitySchema: Realm.ObjectSchema = { // Note: keep Activity and ActivityData in sync, below!
  name: 'Activity',
  primaryKey: 'id',
  properties: {
    id: 'string',
    schemaVersion: 'int',
    odoStart: 'int?',
    tFirstLoc: { type: 'int?', indexed: true },
    tLastLoc: 'int?',
    tLastRefresh: { type: 'int', indexed: true }, // See refreshActivity. May change after bumping schemaVersion.
    tLastUpdate: { type: 'int', indexed: true }, // These are the typical updates when tracking.
    tStart: { type: 'int', indexed: true },
    tEnd: { type: 'int', indexed: true },

    // metrics
    count: 'int', // of events
    maxGapTime: 'int?',
    tMaxGapTime: 'int?',

    odo: 'int?', // total distance (meters, so OK that it's an int)
    maxGapDistance: 'int?',
    tMaxGapDistance: 'int?',

    gain: 'int?', // total elevation gain TODO
    loss: 'int?', // total elevation loss TODO

    // bounds
    latMax: 'double?',
    latMin: 'double?',
    lonMax: 'double?',
    lonMin: 'double?',

    extra: 'string?',
    name: 'string?',
    rating: 'double?',

    // TODO caching the first and last known location would be useful for filtering (see tFirstLoc as well)
    // latFirst: 'double?',
    // latLast: 'double?',
    // lonFirst: 'double?',
    // lonLast: 'double?',
  },
}

// ActivityData facilitate creating and updating Activities.
// All the Activity properties above are included, without extending Realm.Object. Here, all but id are optional.
export interface ActivityData {
  // id required
  id: string; // use matching activityId for corresponding START and END marks and events collected between
  schemaVersion: number;

  // All others optional: (TODO should be same properties as in Activity above, but all are optional)
  odoStart?: number;
  tFirstLoc?: number;
  tLastLoc?: Timepoint;
  tLastRefresh?: Timepoint;
  tLastUpdate?: Timepoint;
  tStart?: number;
  tEnd?: number;

  // metrics
  count?: number; // of events

  maxGapTime?: number; // msec
  tMaxGapTime?: number; //timestamp

  odo?: number; // most recent odometer reading
  maxGapDistance?: number; // meters
  tMaxGapDistance?: number; // timestamp

  gain?: number; // total elevation gain TODO
  loss?: number; // total elevation loss TODO

  // bounds
  latMax?: number;
  latMin?: number;
  lonMax?: number;
  lonMin?: number;

  // extra - anything that may not merit inclusion in the general schema, just yet. Might help enable future migrations.
  extra?: string; // could, probably should, be JSON
  name?: string;
  rating?: string;
}

// ActivityDataExtended populate the activities cache in Redux store, and appear on the ActivityList.
export interface ActivityDataExtended extends ActivityData { // these are the 'Extended' properties:
  distance?: number;
  distanceMiles?: number;
  tLast: number; // like tEnd, but works for currentActivity as well as a completed one with a tEnd
  tStartText?: string;
  tStart: number; // non-optional here, overrides optional tStart? above
  tTotal?: number;
  tTotalText?: string;
}

// Note activity and path are bundled here. The activity is everything necessary to populate the ActivityList;
// The path is the one with the individual location data points, which is needed to render a path on the map.
export interface ExportedActivity {
  activity: ActivityData;
  path: PathUpdate;
}

export const extendedActivities = (activities: ActivityData[]) => {
  return activities.map((activityData) => extendActivity(activityData));
}

export const exportActivity = (activity: ActivityData): ExportedActivity | null => {
  const pathUpdate = database.pathUpdateById(activity.id);
  if (pathUpdate) {
    return {
      activity,
      path: pathUpdate,
    }
  }
  return null;
}

export const extendActivity = (activity: ActivityData): ActivityDataExtended => {
  // Note this no longer works in Realm v>3 now that it uses NAPI... spread operator is broken.
  // See https://github.com/realm/realm-js/issues/2844
  // const a = { ...activity } as ActivityDataExtended;
  // Workaround:
  let a = { id: activity.id } as ActivityDataExtended;
  for (const key of Object.keys(ActivitySchema.properties)) {
    a[key] = activity[key];
  }

  try {
    if (a.odo && a.odoStart) {
      a.distance = a.odo - a.odoStart;
      a.distanceMiles = metersToMiles(a.distance);
    }
    if (a.tStart) {
      a.tStartText = new Date(a.tStart).toLocaleString();
      const tEnd = a.tEnd || utils.now();
      if (tEnd) {
        a.tLast = tEnd || utils.now();
        a.tTotal = tEnd - a.tStart;
        a.tTotalText = msecToTimeString(a.tTotal);
      }
    }
  } catch (err) {
    log.warn('extendActivity', err);
  }
  return a;
}

export interface Activity extends ActivityData, Realm.Object {
}
export type Activities = Activity[];

export const loggableActivity = (activity: Activity) => {
  return extendActivity(activity);
}
