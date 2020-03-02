import Realm from 'realm';
import * as uuid from 'uuid/v4';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import {
  Activity,
  ActivityData,
  ActivitySchema,
} from 'lib/activities';
import constants from 'lib/constants';
import store from 'lib/store';
import utils from 'lib/utils';
import log from 'shared/log';
import {
  Path,
  PathSchema,
  PathUpdate,
} from 'lib/paths';
import sharedConstants from 'shared/sharedConstants';
import {
  Events,
  EventSchema,
  GenericEvent,
  GenericEvents,
  Timepoint,
} from 'lib/timeseries';

export interface ActivityIdsResults {
  deleted: string[]; // activityIds mentioned in events without a corresponding Activity
  kept: string[]; // activityIds mentioned in events with a corresponding Activity
  orphaned: string[]; // activityIds of any Activities that lack corresponding events
}

export const LogSchema: Realm.ObjectSchema = {
  name: 'Log',
  properties: {
    t: { type: 'int', indexed: true },
    level: 'string',
    items: 'string[]',
  }
}

export interface LogMessage extends LogMessageData, Realm.Object {
  // nothing beyond those two
}

export interface LogMessageData {
  t: number,
  level: string,
  items: string[],
}

const SettingsSchema: Realm.ObjectSchema = { // singleton bucket for anything else to persist across app sessions
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'int', // singleton, always 1
    backTime: 'double',
    currentActivityId: 'string?',
    followingUser: 'bool',
    grabBarSnapIndex: 'int',
    labelsEnabled: 'bool',
    latMax: 'double',
    latMin: 'double',
    lonMax: 'double',
    lonMin: 'double',
    mapHeading: 'double',
    mapOpacity: 'double',
    mapStyle: 'string',
    mapZoomLevel: 'double',
    pausedTime: 'double',
    selectedActivityId: 'string?',
    timelineNow: 'bool',
    timelineZoomValue: 'double',
    updateTime: 'double',
  }
}

export interface SettingsObject extends Realm.Object { // returned from Realm, resembles ordinary Object, but isn't
  id: number,
  backTime: number;
  currentActivityId?: string,
  followingPath: boolean,
  followingUser: boolean,
  grabBarSnapIndex: number,
  labelsEnabled: boolean;
  latMax: number,
  latMin: number,
  lonMax: number,
  lonMin: number,
  mapHeading: number;
  mapOpacity: number,
  mapStyle: string,
  mapZoomLevel: number;
  pausedTime: number,
  selectedActivityId: string,
  timelineNow: boolean,
  timelineZoomValue: number,
  updateTime: number,
}

const schemaList = [
  ActivitySchema,
  EventSchema,
  LogSchema,
  PathSchema,
  SettingsSchema,
]

// schemaVersion is important to Realm. Running with a bumped up schemaVersion yields a migration callback with the
// oldRealm and newRealm, each of which has a schemaVersion property. It's possible that multiple upgrades will need
// to be performed in sequence during the migration.
const { schemaVersion } = constants.database;
const { bounds, heading } = constants.map.default;

const defaultSettings = {
  id: 1,
  backTime: 0,
  currentActivityId: undefined,
  followingPath: false,
  followingUser: false,
  grabBarSnapIndex: 1,
  labelsEnabled: true,
  latMax: bounds[0][0], // defaults
  latMin: bounds[1][1],
  lonMax: bounds[0][0],
  lonMin: bounds[1][0],
  mapHeading: heading,
  mapOpacity: constants.map.default.opacity,
  mapStyle: constants.map.default.style,
  mapZoomLevel: 0,
  pausedTime: 0,
  selectedActivityId: undefined,
  timelineNow: true,
  timelineZoomValue: constants.timeline.default.zoomValue,
  updateTime: 0,
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
  schema: schemaList,
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

  activityIds: (): ActivityIdsResults => {
    // Note TRUEPREDICATE filter lets everything through, though DISTINCT will massively cull the results.
    const eventsWithDistinctActivityIds = realm.objects('Event')
      .filtered('TRUEPREDICATE SORT(t ASC, activityId ASC) DISTINCT(activityId)');
    const activityIdsOfEvents: string[] = eventsWithDistinctActivityIds
      .map((e => (e as any as GenericEvent).activityId))
      .filter((id: string | undefined) => !!(id && id.length > 0)) as string[];

    const activityIds = database.activities().sorted('tStart').map((activity: Activity) => activity.id);

    // If an id is in both of those lists (activityIds, activityIdsOfEvents)
    // then we can recreate the Activity, Path, etc. from the underlying events.
    // If an id in activityIdsOfEvents is missing from activityIds, it has been deleted.
    const deletedActivityIds = [] as string[];
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
    return {
      deleted: deletedActivityIds,
      kept: keptActivityIds,
      orphaned: orphanedActivityIds,
    }
  },

  // It's quite likely that a minor schema change in the DB will not require any migration of Activities or Paths.
  // The schemaVersion of the Activity/Path is stored on the Activity so migrations can be performed as needed.
  completeAnyMigration: () => {
    if (migrationRequired) {
      log.info('database.completeMigration');

      // Migrate Activities and Paths, based on underlying Events
      // TODO full refresh is expensive and not required in the general case. Should this change:
      // store.dispatch(newAction(AppAction.refreshAllActivities));
    }
  },

  // Return new Activity. Creates Path with corresponding id.
  createActivity: (now: number, odoStart: number = 0): Activity => {
    const newActivityTemplate: ActivityData = {
      id: uuid.default(),
      schemaVersion,
      count: 0,
      gain: 0,
      loss: 0,
      odo: 0,
      odoStart,
      tLastRefresh: 0,
      tLastUpdate: now,
      tStart: now,
      tEnd: 0,
    }
    let newActivity;
    realm.write(() => {
      newActivity = realm.create('Activity', newActivityTemplate);
      const pathUpdate = database.newPathUpdate(newActivityTemplate.id);
      // create Path right away
      const path = realm.create('Path', pathUpdate, Realm.UpdateMode.Modified) as Path;
      // TODO could cache this path, though there's no need now.
    })
    return newActivity;
  },

  eventsForActivity: (id: string): Events => {
    return database.events().filtered('activityId == $0', id);
  },

  // Delete both the Activity and its corresponding Path
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

  // Update both the Activity and its corresponding Path
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

  // logs

  appendLogMessage: async (message: LogMessageData) => {
    realm.write(() => {
      realm.create('Log', message, Realm.UpdateMode.All);
    })
  },

  clearLogs: async () => {
    let logs = realm.objects('Log')
    if (logs.length) {
      realm.write(() => {
        realm.delete(logs);
      })
    }
  },

  logs: () => {
    return realm.objects('Log')
                .sorted('t');
  },

  // settings

  changeSettings: async (changes: any) => {
    try {
      const now = utils.now();
      const settings = realm.objects('Settings') as Realm.Results<SettingsObject>;
      if (settings.length) {
        realm.write(() => {
          for (let [key, value] of Object.entries(changes)) {
            settings[0][key] = value;
          }
          settings[0].updateTime = now;
          // log.debug('changeSettings changes:', changes);
        })
      } else {
        // Note id is always 1 (Settings is a singleton)
        // Initialize settings:
        const settings = { ...defaultSettings, ...changes, updateTime: now }; // merge any changes
        realm.write(() => {
          realm.create('Settings', settings, true); // true: update
        })
        log.debug('changeSettings wrote:', settings);
      }
      // log.trace('changeSettings', 'changes', changes, 'new settings', settings[0]);
    } catch (err) {
      log.error('changeSettings error', err);
    }
  },

  // Paths

  // TODO always keep appendToPath in sync with PathSchema
  appendToPath: (update: PathUpdate) => {
    const path = database.pathById(update.id);
    if (path && update.lats && update.lons && update.lats.length === update.lons.length) {
      realm.write(() => {
        path.ele.push(...update.ele || constants.paths.elevationUnvailable);
        path.lats.push(...update.lats);
        path.lons.push(...update.lons);
        path.mode.push(...update.mode);
        path.odo.push(...update.odo);
        path.speed.push(...update.speed);
        path.t.push(...update.t);
      })
    }
  },

  // TODO always keep newPathUpdate in sync with PathSchema
  newPathUpdate: (id: string): PathUpdate => ({
    ele: [],
    id,
    lats: [],
    lons: [],
    mode: [],
    odo: [],
    schemaVersion,
    speed: [],
    t: [],
  }),

  // TODO reselect
  pathById: (id: string): Path | undefined => {
    if (!id) {
      return undefined;
    }
    return realm.objectForPrimaryKey('Path', id);
  },

  pathUpdateById: (id: string): PathUpdate | undefined => {
    const path = database.pathById(id);
    if (!path) {
      return undefined;
    }
    return {
      ele: Array.from(path.ele),
      id,
      lats: Array.from(path.lats),
      lons: Array.from(path.lons),
      mode: Array.from(path.mode),
      odo: Array.from(path.odo),
      schemaVersion,
      speed: Array.from(path.speed),
      t: Array.from(path.t),
    }
  },

  paths: (): any => (
    realm.objects('Path') as Realm.Results<Path>
  ),

  settings: (): any => {
    try {
      const currentState = realm.objects('Settings') as Realm.Results<SettingsObject>;
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
