import Realm from 'realm';

// NOTE: There are corresponding TypeScript types that need to be kept in sync with this, and Schema migrations must be
// provided if the schema should change. The TypeScript types are

const EventSchema: Realm.ObjectSchema = {
  name: 'EventSchema',
  properties: {
    // GenericEvent
    source: 'string?', // optional
    t: { type: 'int', indexed: true }, // required
    type: 'string', // required. Based on this, there may be additional properties: All are said to be optional here for
                    // the Realm scehema, but the corresponding TypeScript types clarify what is truly optional.

    // AppStateChangeEvent
    newState: 'string?',

    // AppUserActionEvent
    userAction: 'string?',

    // LocationEvent
    accuracy: 'number?',
    ele: 'int?',
    extra: 'string?',
    heading: 'int?',
    loc: 'int[]?',
    odo: 'int?',
    speed: 'int?',

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

const config = { schema: [EventSchema] } as Realm.Configuration;
const realm = new Realm(config);

realm.write(() => {
})

realm.objects
