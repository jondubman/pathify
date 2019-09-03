import Realm from 'realm';

import { Events, GenericEvent, GenericEvents } from 'shared/timeseries';
import log from 'shared/log';

// NOTE: There are corresponding TypeScript types that need to be kept in sync with this, and Schema migrations must be
// provided if the schema should change. The TypeScript types are

const EventSchema: Realm.ObjectSchema = {
  name: 'EventSchema',
  properties: {
    // GenericEvent
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
    ele: 'int?',
    extra: 'string?',
    heading: 'float?',
    loc: 'double?[]', // https://academy.realm.io/posts/realm-list-new-superpowers-array-primitives/
    odo: 'float?',
    speed: 'float?',

    // MarkEvent
    id: 'string?',
    subtype: 'string?',
    synthetic: 'bool?',

    // MotionEvent
    isMoving: 'bool?',

    // ModeChangeEvent
    mode: 'string?',
    confidence: 'int?',
  }
}

// TODO use deleteRealmIfMigrationNeeded: false for production - see https://realm.io/docs/javascript/latest/
const config = { schema: [EventSchema], deleteRealmIfMigrationNeeded: true } as Realm.Configuration;
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
