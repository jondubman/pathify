// TODO with Realm

import Realm from 'realm';
// import log from 'shared/log';

const GenericEventSchema = {
  name: 'GenericEvent',
  properties: {
    // GenericEvent
    source: 'string?',
    t: { type: 'int', indexed: true },
    type: 'string',

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

const config = { schema: [GenericEventSchema] } as Realm.Configuration;
const realm = new Realm(config);

realm.write(() => {
})

realm.objects
