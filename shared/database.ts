import Realm from 'realm';
import * as uuid from 'uuid/v4';

import { LonLat } from './locations';
import sharedConstants from './sharedConstants';
import {
  Events,
  GenericEvent,
  GenericEvents,
  Timepoint,
} from './timeseries';
import {
  Activity,
  ActivityUpdate,
  ActivitySchema,
} from './activities';

import log from './log';

// TODO move EventSchema to separate events module in shared code, or timeseries module
// NOTE: There are corresponding TypeScript types that need to be kept in sync with EventSchema,
// and Schema migrations must be provided if the schema should change. See GenericEvent and related types.
const EventSchema: Realm.ObjectSchema = {
  name: 'Event',
  properties: {
    // GenericEvent
    activityId: { type: 'string?', indexed: true },
    index: 'int?',
    source: 'string?',
    t: { type: 'int', indexed: true }, // required
    // type is required. Based on this, there may be additional properties. All are said to be optional here for
    // the Realm scehema, but the corresponding TypeScript types clarify what is truly optional.
    type: { type: 'string', indexed: true },

    // AppStateChangeEvent
    newState: 'string?',

    // AppUserActionEvent
    userAction: 'string?',

    // LocationEvent - first the raw properties from geolocation:
    accuracy: 'int?',
    battery: 'float?',
    charging: 'bool?',
    ele: 'int?',
    extra: 'string?',
    heading: 'float?',
    lat: 'double?', // note: also indexing integer versions of these same coordinates
    lon: 'double?', // because you cannot index a float/double in Realm.
    latIndexed: { type: 'int?', indexed: true }, // lat times 1M, and rounded to an int
    lonIndexed: { type: 'int?', indexed: true }, // lon times 1M, and rounded to an int
    odo: 'float?',
    speed: 'float?',
    // + derived properties:
    gain: 'float?', // cumulative elevation gain within activity TODO2
    loss: 'float?', // cumulative elevation gain within activity TODO2

    // MarkEvent
    subtype: 'string?',
    synthetic: 'bool?',

    // MotionEvent
    isMoving: 'bool?',

    // ModeChangeEvent
    mode: 'string?', // note: Also used in LocationEvent (TODO2)
    confidence: 'int?',
  }
}

const SettingsSchema: Realm.ObjectSchema = { // singleton bucket for anything else to persist across app sessions
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'int', // singleton, always 1
    currentActivityId: 'string?',
  }
}

const schema = [
  ActivitySchema,
  EventSchema,
  SettingsSchema,
]
// TODO use deleteRealmIfMigrationNeeded: false for production - see https://realm.io/docs/javascript/latest/
const config = { schema, deleteRealmIfMigrationNeeded: true } as Realm.Configuration;
const realm = new Realm(config);

// TODO which errors to handle?

const database = {
  // activities

  activityById: (id: string): Activity | undefined => {
    return realm.objectForPrimaryKey('Activity', id);
  },

  activityForTimepoint: (t: Timepoint): Activity | null => {
    const activities = database.activities().filtered('tStart <= $0 AND (tEnd == 0 OR tEnd >= $0)', t);
    if (activities.length === 1) {
      return activities[0];
    }
    if (activities.length) {
      log.warn('>1 Activity containing timepoint', t);
    }
    return null;
  },

  activities: (): Realm.Results<Activity> => (
    realm.objects('Activity')
         .filtered('tStart >= $0', Math.max(0, Date.now() - sharedConstants.maxAgeEvents))
         .sorted('tStart') as Realm.Results<Activity>
  ),

  // Return new Activity
  createActivity: (now: number, odoStart: number = 0): Activity => {
    const newActivityTemplate: ActivityUpdate = {
      id: uuid.default(),
      count: 0,
      gain: 0,
      tLastUpdate: now,
      loss: 0,
      odo: 0,
      odoStart,
      pathLons: [],
      pathLats: [],
      tStart: now,
      tEnd: 0,
    }
    let newActivity;
    realm.write(() => {
      newActivity = realm.create('Activity', newActivityTemplate);
    })
    return newActivity;
  },

  // Return updated Activity
  updateActivity: (activityUpdate: ActivityUpdate, pathExtension: LonLat[] = []): Activity => {
    let activity: Activity;
    realm.write(() => {
      activity = realm.create('Activity', activityUpdate, true) as Activity; // true: update
      const lons = pathExtension.map((lonLat: LonLat) => lonLat[0]);
      const lats = pathExtension.map((lonLat: LonLat) => lonLat[1]);
      activity.pathLats.push(...lats);
      activity.pathLons.push(...lons);
    })
    return JSON.parse(JSON.stringify(activity!)) as Activity;
  },

  deleteActivity: (activityId: string): void => {
    let existingActivity = realm.objects('Activity')
                                .filtered(`id == "${activityId}"`);
    if (existingActivity) {
      realm.delete(existingActivity);
    }
  },

  // events

  createEvents: (events: GenericEvents): void => {
    realm.write(() => {
      events.forEach((event: GenericEvent) => {
        realm.create('Event', event);
      })
    })
  },

  // This is the essentially the "read" function for events stored in Realm.
  // As this is a thin wrapper around Realm.objects, result has methods that resemble those of an array, but should be
  // filtered, sorted, etc. using the Realm-JS API: https://realm.io/docs/javascript/latest/
  events: (): Events => {
    if (!sharedConstants.maxAgeEvents || sharedConstants.maxAgeEvents === Infinity) {
      return realm.objects('Event')
                  .sorted('t'); // always sort by time (which is indexed) first
    }
    return realm.objects('Event')
                .filtered('tStart >= $0', Math.max(0, Date.now() - sharedConstants.maxAgeEvents))
                .sorted('t'); // always sort by time (which is indexed) first
  },

  // settings

  changeSettings: (changes: any): void => {
    try {
      const currentState = realm.objects('Settings');
      let newState = { id: 1 }; // always the same (Settings is a singleton)
      if (currentState.length) {
        newState = { ...currentState[0], ...changes };
      }
      log.info('changeSettings', newState);
      realm.write(() => {
        realm.create('Settings', newState, true); // true: update
      })
    } catch (err) {
      log.error('changeSettings error', err);
    }
  },

  settings: (): any => {
    try {
      const currentState = realm.objects('Settings');
      if (currentState.length) {
        return currentState[0]; // return all the settings
      }
      return {};
    } catch (err) {
      return {};
    }
  },

  reset: () => {
    log.debug('Resetting Realm database!');
    realm.write(() => {
      realm.deleteAll(); // Boom!
    })
  },
}

export default database;
