import Realm from 'realm';

import { Events, GenericEvent, GenericEvents } from 'shared/timeseries';
import log from 'shared/log';

// NOTE: There are corresponding TypeScript types that need to be kept in sync with this, and Schema migrations must be
// provided if the schema should change. The TypeScript types are

const EventSchema: Realm.ObjectSchema = {
  name: 'EventSchema',
  properties: {
    // GenericEvent
    activityId: 'string?', // TODO add index
    source: 'string?', // optional
    t: { type: 'int', indexed: true }, // required
    // type is required. Based on this, there may be additional properties. All are said to be optional here for
    // the Realm scehema, but the corresponding TypeScript types clarify what is truly optional.
    type: { type: 'string', indexed: true },

    // AppStateChangeEvent
    newState: 'string?',

    // AppUserActionEvent
    userAction: 'string?',

    // LocationEvent
    accuracy: 'int?',
    battery: 'float?',
    charging: 'bool?',
    ele: 'int?',
    extra: 'string?',
    heading: 'float?',
    lat: 'double?', // TODO add index
    lon: 'double?', // TODO add index
    odo: 'float?',
    speed: 'float?',

    // MarkEvent
    subtype: 'string?',
    synthetic: 'bool?',

    // MotionEvent
    isMoving: 'bool?',

    // ModeChangeEvent
    mode: 'string?',
    confidence: 'int?',
  }
}

const SettingsSchema: Realm.ObjectSchema = { // singleton for stuff we want to persist across app sessions
  name: 'SettingsSchema',
  primaryKey: 'id',
  properties: {
    id: 'int', // singleton, always 1
    currentActivityId: 'string?',
    currentActivityStartTime: 'int?',
  }
}

const schema = [
  EventSchema,
  SettingsSchema,
]
// TODO use deleteRealmIfMigrationNeeded: false for production - see https://realm.io/docs/javascript/latest/
const config = { schema, deleteRealmIfMigrationNeeded: true } as Realm.Configuration;
const realm = new Realm(config);

const database = {
  createEvents: (events: GenericEvents): void => {
    realm.write(() => {
      events.forEach((event: GenericEvent) => {
        realm.create('EventSchema', event);
      })
    })
  },

  // This is the essentially the "read" function for Realm.
  // As this is a thin wrapper around Realm.objects, result has methods that resemble those of an array, but should be
  // filtered, sorted, etc. using the Realm-JS API: https://realm.io/docs/javascript/latest/
  events: (): Events => {
    return realm.objects('EventSchema').sorted('t'); // always sort by time (which is indexed) first
  },

  changeSettings: (changes: any): void => {
    try {
      const currentState = realm.objects('SettingsSchema');
      let newState = { id: 1 };
      if (currentState.length) {
        newState = { ...currentState[0], ...changes };
      }
      log.info('changeSettings', newState);
      realm.write(() => {
        realm.create('SettingsSchema', newState, true); // true: update
      })
    } catch (err) {
      log.error('changeSettings error', err);
    }
  },

  settings: (): any => {
    try {
      const currentState = realm.objects('SettingsSchema');
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

  // TODO
  // update: () => {
  // },

  // TODO
  // delete: () => {
  // },
}

export default database;
