import Realm from 'realm';
import * as uuid from 'uuid/v4';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import store from 'lib/store';
import {
  Activity,
  ActivityData,
  ActivitySchema,
} from 'shared/activities';
import { LonLat } from 'shared/locations';
import {
  Path,
  PathSchema,
  PathUpdate,
} from 'shared/paths';
import sharedConstants from 'shared/sharedConstants';
import {
  Events,
  EventSchema,
  GenericEvent,
  GenericEvents,
  Timepoint,
} from 'shared/timeseries';

import log from 'shared/log';

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
  PathSchema,
  SettingsSchema,
]

// schemaVersion is important to Realm. Running with a bumped up schemaVersion yields a migration callback with the
// oldRealm and newRealm, each of which has a schemaVersion property. It's possible that multiple upgrades will need
// to be performed in sequence during the migration.
const { schemaVersion } = constants.database;

const defaultSettings = {
  id: 1,
  currentActivityId: undefined,
  followingUser: false,
  latMax: 0,
  latMin: 0,
  lonMax: 0,
  lonMin: 0,
  mapFullScreen: false,
  mapOpacity: constants.map.default.opacity,
  mapStyle: constants.map.default.style,
  pausedTime: 0,
  showTimeline: true,
  timelineNow: true,
  timelineZoomValue: constants.timeline.default.zoomValue,
}

let migrationRequired = false;

const migration: Realm.MigrationCallback = (oldRealm: Realm, newRealm: Realm): void => {
  if (oldRealm.schemaVersion < schemaVersion) {
    // Migrate Settings
    // TODO this currently overwrites user settings with new defaults on any DB migration; fix this for production.
    let oldSettings;
    if (oldRealm.objects('Settings').length > 0) {
      oldSettings = oldRealm.objects('Settings')[0] as SettingsObject;
    }
    newRealm.create('Settings', { ...defaultSettings, ...oldSettings }, true); // true: update

    migrationRequired = true;
  }
}

const config: Realm.Configuration = {
  deleteRealmIfMigrationNeeded: false, // Use false for production, as using true will result in irreversible data loss!
  migration,
  schema,
  schemaVersion,
}
const realm = new Realm(config); // This performs a migration if needed

// TODO which errors to handle?

const database = {
  // activities

  activities: (): Realm.Results<Activity> => (
    realm.objects('Activity')
      .filtered('tStart >= $0', Math.max(0, Date.now() - sharedConstants.maxAgeEvents))
      .sorted('tStart') as Realm.Results<Activity>
  ),

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

  // Return the activityIds that remain in active use in the app (i.e. have the events, plus the corresponding Activity)
  activityIds: (): string[] => {
    const eventsWithDistinctActivityIds = realm.objects('Event')
      .filtered('TRUEPREDICATE SORT(t ASC, activityId ASC) DISTINCT(activityId)');
    const activityIdsOfEvents: string[] = eventsWithDistinctActivityIds
      .map((e => (e as any as GenericEvent).activityId))
      .filter((id: string | undefined) => !!(id && id.length > 0)) as string[];
    // log.trace(activityIdsOfEvents.length, 'activityIdsOfEvents', activityIdsOfEvents);

    const activityIds = database.activities().sorted('tStart').map((activity: Activity) => activity.id);
    // log.trace(activityIds.length, 'activityIds', activityIds);

    // If an id is in both of those lists (activityIds, activityIdsOfEvents)
    // then we can recreate the Activity, Path, etc. from the underlying events.
    // If an id in activityIdsOfEvents is missing from activityIds, it has been deleted.
    const deletedActivityIds = [] as string[]; // TODO not currently used
    const keptActivityIds = [] as string[]; // activityIds mentioned in events whose activity exists
    const orphanedActivityIds = [] as string[]; // activityIds mentioned in events but whose activity was deleted
    activityIdsOfEvents.map((id: string) => {
      if (activityIds.includes(id)) {
        keptActivityIds.push(id);
      } else {
        deletedActivityIds.push(id);
      }
    })
    activityIds.map((id: string) => {
      if (!activityIdsOfEvents.includes(id)) {
        orphanedActivityIds.push(id); // TODO knowing these, it would be easy to delete orphaned events.
      }
    })
    log.trace(deletedActivityIds.length, 'deletedActivityIds', deletedActivityIds);
    log.trace(keptActivityIds.length, 'keptActivityIds', keptActivityIds);
    log.trace(orphanedActivityIds.length, 'orphanedActivityIds', orphanedActivityIds);
    return keptActivityIds;
  },

  completeAnyMigration: () => {
    if (migrationRequired) {
      log.info('database.completeMigration');

      // Migrate Activities and Paths, based on underlying Events
      store.dispatch(newAction(AppAction.refreshAllActivities));
    }
  },

  // Return new Activity
  createActivity: (now: number, odoStart: number = 0): Activity => {
    const newActivityTemplate: ActivityData = {
      id: uuid.default(),
      schemaVersion,
      count: 0,
      gain: 0,
      loss: 0,
      odo: 0,
      odoStart,
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

  updateActivity: async (activityUpdate: ActivityData, pathUpdate: PathUpdate | undefined = undefined) => {
    let activity: Activity | null = null;
    realm.write(() => {
      activity = realm.create('Activity', activityUpdate, Realm.UpdateMode.Modified) as Activity; // true: update
      if (pathUpdate) { // otherwise leave it alone
        const path = realm.create('Path', pathUpdate, Realm.UpdateMode.Modified) as Path;
      }
    })
    if (activity) {
      store.dispatch(newAction(AppAction.refreshCachedActivity, { activityId: activity!.id }));
    }
  },

  deleteActivity: (activityId: string): void => {
    let existingActivity = realm.objects('Activity')
                                .filtered(`id == "${activityId}"`);
    let existingPath = realm.objects('Path')
                            .filtered(`id == "${activityId}"`);
    if (existingActivity || existingPath) {
      realm.write(() => {
        if (existingActivity) {
          realm.delete(existingActivity);
        }
        if (existingPath) {
          realm.delete(existingPath);
        }
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
        const settings = { ...defaultSettings, ...changes }; // merge any changes
        realm.write(() => {
          realm.create('Settings', settings, true); // true: update
        })
      }
      // log.trace('changeSettings', 'changes', changes, 'new settings', settings[0]);
    } catch (err) {
      log.error('changeSettings error', err);
    }
  },

  // paths

  appendToPath: ({ id, lat, lon }) => {
    const path = database.pathById(id);
    if (path) {
      realm.write(() => {
        path.lats.push(lat);
        path.lons.push(lon);
      })
    }
  },

  pathById: (id: string): Path | undefined => {
    if (!id) {
      return undefined;
    }
    return realm.objectForPrimaryKey('Path', id);
  },

  paths: (): any => (
    realm.objects('Path') as Realm.Results<Path>
  ),

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

  // Caution: This will simply, instantly delete EVERYTHING in the database! There is no undo!
  reset: async () => {
    log.debug('Resetting Realm database!');
    realm.write(() => {
      realm.deleteAll(); // Boom!
    })
  },
}

export default database;
