import * as express from 'express';
import * as util from 'util'
import * as uuid from 'uuid/v4';

var router = express.Router()

import { log } from 'lib/log-bunyan';
import { clientIdForAlias, pushToClient } from 'lib/client';
import { setTimeout } from 'timers';
import { constants } from 'lib/constants';

// interface AppQueryParams {
//   timeout?: number;
//   query?: string; // empty query is just a ping
//   uuid: string;
// }
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
  const message = { ...req.body };
  if (message.type === 'appQuery') { // TODO appAction.appQuery
    if (!message.params) { // TODO message.params is type AppQueryParams
      message.params = {}; // this allows us to send an empty query, which is essentially a ping
    }
    const appQueryUuid = uuid();
    message.params.uuid = appQueryUuid;
    log.debug('message at this point', message);
    if (appQueryPromises[appQueryUuid]) {
      log.warn('call to appQuery with existing uuid'); // not likely!
    } else {
      new Promise<AppQueryResponse>((resolve, reject) => {
        appQueryPromises[appQueryUuid] = { resolve, reject };
        const timeout = message.params.timeout || constants.appQueryDefaultTimeout;
        // hopefully app will respond by posting to /appQueryResponse, but if not:
        setTimeout(() => {
          reject('timeout');
        }, timeout);
      }).then(appQueryResponse => { // the POST to /appQueryResponse gets us here
        const { response } = appQueryResponse;
        const responseReadable = util.inspect(response, { depth: 4 });
        log.info(`response from clientId ${clientId}: ${responseReadable}`);
        // forward response to whoever requested that we post this JSON to the app
        res.send(JSON.stringify(response));
      }).catch(error => {
        try {
          log.info(`appQuery timeout, clientId ${clientId}`);
          res.send({ error });
        } catch(err) {
          log.error('subsequent error, probably: Cannot set headers after they are sent to the client');
        }
      })
    }
  }
  // Push message to client (whether appQuery, or any other)
  if (!clientAlias && !clientId) {
    res.send({ message: 'No client specified; set environment variable CA for client alias or CID for client ID' });
    return;
  }
  const inspect = JSON.stringify(message);
  log.debug(`push object to clientAlias ${clientAlias}, clientId ${clientId}, message ${inspect}`);
  pushToClient(message, clientId, clientAlias);

  if (message.type !== 'appQuery') { // The handler for appQueryResponse should respond for an appQuery.
    // typical scenario
    res.send({ message: 'OK' });
  }
})

router.post('/appQueryResponse', function (req, res) {
  const appQueryResponse = req.body.params as AppQueryResponse;
  log.debug('/appQueryResponse', appQueryResponse);
  const { resolve } = appQueryPromises[appQueryResponse.uuid];
  resolve(appQueryResponse); // this should forward the response to the original requester
  res.send({ message: 'OK' });
})

export { router as push };
