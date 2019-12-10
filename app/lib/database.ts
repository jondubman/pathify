import Realm from 'realm';
import * as uuid from 'uuid/v4';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import store from 'lib/store';
import { LonLat } from 'shared/locations';
import sharedConstants from 'shared/sharedConstants';
import {
  Events,
  EventSchema,
  GenericEvent,
  GenericEvents,
  Timepoint,
} from 'shared/timeseries';
import {
  Activity,
  ActivityData,
  ActivitySchema,
} from 'shared/activities';

import log from 'shared/log';

const schemaVersion = 9;

const SettingsSchema: Realm.ObjectSchema = { // singleton bucket for anything else to persist across app sessions
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'int', // singleton, always 1
    currentActivityId: 'string?',
    followingUser: 'bool',
    latMax: 'double',
    latMin: 'double',
    lonMax: 'double',
    lonMin: 'double',
    mapFullScreen: 'bool',
    mapOpacity: 'double',
    mapStyle: 'string',
    pausedTime: 'int',
    showTimeline: 'bool',
    timelineNow: 'bool',
    timelineZoomValue: 'double',
  }
}

export interface SettingsObject extends Realm.Object { // returned from Realm, resembles ordinary Object, but isn't
  id: number,
  currentActivityId?: string,
  followingUser: boolean,
  latMax: number,
  latMin: number,
  lonMax: number,
  lonMin: number,
  mapFullScreen: boolean,
  mapOpacity: number,
  mapStyle: string,
  pausedTime: number,
  showTimeline: boolean,
  timelineNow: boolean,
  timelineZoomValue: number,
}

const schema = [
  ActivitySchema,
  EventSchema,
  SettingsSchema,
]

const migration: Realm.MigrationCallback = (oldRealm: Realm, newRealm: Realm): void => {
  if (oldRealm.schemaVersion < schemaVersion) {
    const oldSettings = oldRealm.objects('Settings')[0] as SettingsObject;
    const newSettings = newRealm.objects('Settings')[0] as SettingsObject;
    newSettings.currentActivityId = oldSettings.currentActivityId;
    newSettings.followingUser = false;
    newSettings.latMax = 0;
    newSettings.latMin = 0;
    newSettings.lonMax = 0;
    newSettings.lonMin = 0;
    newSettings.mapFullScreen = false;
    newSettings.mapOpacity = constants.map.default.opacity,
    newSettings.mapStyle = constants.map.default.style,
    newSettings.pausedTime = 0;
    newSettings.showTimeline = true,
    newSettings.timelineNow = true;
    newSettings.timelineZoomValue = constants.timeline.default.zoomValue;
  }
}

// TODO always use deleteRealmIfMigrationNeeded: false for production - see https://realm.io/docs/javascript/latest/
const config: Realm.Configuration = {
  deleteRealmIfMigrationNeeded: false,
  migration,
  schema,
  schemaVersion,
}
const realm = new Realm(config);

// TODO which errors to handle?

const database = {
  // activities

  activityById: (id: string): Activity | undefined => {
    if (!id) {
      return undefined;
    }
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
    const newActivityTemplate: ActivityData = {
      id: uuid.default(),
      count: 0,
      gain: 0,
      loss: 0,
      odo: 0,
      odoStart,
      pathLons: [],
      pathLats: [],
      tLastUpdate: now,
      tStart: now,
      tEnd: 0,
    }
    let newActivity;
    realm.write(() => {
      newActivity = realm.create('Activity', newActivityTemplate);
    })
    return newActivity;
  },

  eventsForActivity: (id: string): Events => {
    return database.events().filtered('activityId == $0', id);
  },

  updateActivity: async (activityUpdate: ActivityData, pathExtension: LonLat[] = []) => {
    let activity: Activity | null = null;
    realm.write(() => {
      activity = realm.create('Activity', activityUpdate, true) as Activity; // true: update
      const lons = pathExtension.map((lonLat: LonLat) => lonLat[0]);
      const lats = pathExtension.map((lonLat: LonLat) => lonLat[1]);
      activity.pathLats.push(...lats);
      activity.pathLons.push(...lons);
    })
    if (activity) {
      store.dispatch(newAction(AppAction.refreshCachedActivity, { activityId: activity!.id }));
    }
  },

  deleteActivity: (activityId: string): void => {
    let existingActivity = realm.objects('Activity')
                                .filtered(`id == "${activityId}"`);
    if (existingActivity) {
      realm.write(() => {
        realm.delete(existingActivity);
      })
    }
  },

  // events

  createEvents: async (events: GenericEvents) => {
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

  changeSettings: async (changes: any) => {
    try {
      const settings = realm.objects('Settings');
      if (settings.length) {
        realm.write(() => {
          for (let [key, value] of Object.entries(changes)) {
            settings[0][key] = value;
          }
        })
      } else {
        // Note id is always 1 (Settings is a singleton)
        // Initialize settings:
        const settings = { id: 1, ...changes }; // merge any changes
        realm.write(() => {
          realm.create('Settings', settings, true); // true: update
        })
      }
      log.trace('changeSettings', 'changes', changes, 'new settings', settings[0]);
    } catch (err) {
      log.error('changeSettings error', err);
    }
  },

  settings: (): any => {
    try {
      const currentState = realm.objects('Settings');
      if (currentState.length) {
        return { ...currentState[0], schemaVersion }; // return a copy of all the settings plus schemaVersion
      }
      return {};
    } catch (err) {
      return {};
    }
  },

  reset: async () => {
    log.debug('Resetting Realm database!');
    realm.write(() => {
      realm.deleteAll(); // Boom!
    })
  },
}

export default database;
