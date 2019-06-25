import * as express from 'express';
import * as uuid from 'uuid/v4';

var router = express.Router()

import { log } from 'lib/log-bunyan';
import { clientIdForAlias, pushToClient } from 'lib/client';

interface AppQueryParams { // TODO this also appears in actions module on client; interface definition should be shared
  timeout?: number;
  query?: string; // empty query is just a ping
  uuid: string;
}
interface AppQueryResponse {
  uuid: string;
  response: any;
}
interface AppQueryPromise {
  resolve: Function;
  reject: Function;
}
type AppQueryPromises = { [key: string]: AppQueryPromise }; // key is uuid
let appQueryPromises: AppQueryPromises = {};

// GET can be used to push simple string messages to the app
router.get('/', function (req, res) {
  const { clientAlias, clientId, message } = req.query;
  log.debug(`push text clientAlias ${clientAlias}, clientId ${clientId}, message ${message}`);
  pushToClient(message, clientId, clientAlias);
  res.send({ message: 'done' });
})

// Push JSON to the app.
router.post('/', function (req, res) {
  const { clientAlias } = req.query;
  let { clientId } = req.query;

  // OK for clientId to be missing if we have clientAlias
  // If both are provided by mistake, clientAlias overrides.
  if (clientAlias) {
    clientId = clientIdForAlias(clientAlias);
  }
  const message = req.body;
  if (message.type === 'appQuery') { // TODO appAction.appQuery
    const appQuery = (message.params || {}) as AppQueryParams;
    appQuery.uuid = uuid();
    if (appQueryPromises[uuid]) {
      log.warn('call to appQuery with existing uuid'); // not likely!
    } else {
      new Promise<AppQueryResponse>((resolve, reject) => {
        appQueryPromises[uuid] = { resolve, reject };
        // hopefully app will respond by posting to /appQueryResponse
      }).then(response => {
        log.info(`response from clientId ${clientId}: ${response}`);
        res.send(response); // forward response to whoever requested that we post this JSON to the app
        return response;
      })
    }
  }
  const inspect = JSON.stringify(message);
  log.debug(`push object to clientAlias ${clientAlias}, clientId ${clientId}, message ${inspect}`);
  pushToClient(message, clientId, clientAlias);

  if (message.type !== 'appQuery') {
    res.send({ message: 'done' });
  } else {
    res.send({ message: 'appQuery done' }); // TODO
  }
})

router.post('/appQueryResponse', function (req, res) {
  const appQueryResponse = req.body as AppQueryResponse;
  const { resolve } = appQueryPromises[uuid];
  resolve(req.query); // this should forward the response to the original requester
})

export { router as push };
