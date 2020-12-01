import * as express from 'express';
import * as util from 'util'
import { v4 as uuidv4 } from 'uuid';

var router = express.Router()

import log from 'shared/log';
import {
  clientIdForAlias,
  pushToClient,
} from 'lib/client';
import { setTimeout } from 'timers';
import { constants } from 'lib/constants';
import {
  AppQueryParams,
  AppQueryResponse,
} from 'shared/appQuery';
import { messageToLog } from 'shared/log';

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
  pushToClient(message, clientId.toString(), clientAlias.toString());
  res.send({ message: 'done' });
})

// Push JSON to the app.
// The way this works is, you POST to the Pathify server, and that pushes to a connected client (running in devMode)
// whose clientId matches that of the running app.
router.post('/', function (req, res) {
  const { clientAlias } = req.query;
  let { clientId } = req.query;

  log.debug(`/push request to clientAlias ${clientAlias}, clientId ${clientId}`);
  // OK for clientId to be missing if we have clientAlias
  // If both are provided, clientAlias overrides.
  if (clientAlias) {
    clientId = clientIdForAlias(clientAlias.toString());
  }
  if (!clientId) {
    res.send({ message: 'No client specified; set environment variable CA for client alias or CID for client ID' });
    return;
  }
  // Push message to client
  const message = { ...req.body };

  // Special case to support round trip server-initiated queries into a running app:
  //   When server receives appQuery request,
  //   server pushes this 'query' to the app;
  //   app responds with POST to /appQueryResponse (or timeout);
  //   then server forwards the app's response to the original requester by responding to this request

  if (message.type === 'appQuery') {
    const appQueryUuid = uuidv4();
    message.params = { ...message.params, uuid: appQueryUuid } as AppQueryParams;
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
      }).then(appQueryResponse => { // a POST to /appQueryResponse gets us here
        const { response } = appQueryResponse;
        const responseReadable = util.inspect(response, { depth: 4 });
        log.info(`response from clientId ${clientId}: ${responseReadable}`);
        // forward response to whoever requested that we post this JSON to the app
        res.send(JSON.stringify(response));
      }).catch(error => {
        try {
          log.info(`appQuery timeout, clientAlias ${clientAlias}, clientId ${clientId}`);
          res.send({ error });
        } catch(err) {
          log.error('subsequent error, probably: Cannot set headers after they are sent to the client');
        }
      })
    }
  }
  log.debug(`push object to clientAlias ${clientAlias}, clientId ${clientId}, message`, messageToLog(message));
  pushToClient(message, clientId.toString(), clientAlias.toString());

  if (message.type !== 'appQuery') { // The handler for POST to /appQueryResponse above should respond to an appQuery.
    res.send({ message: 'OK' }); // typical
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
