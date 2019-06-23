import * as express from 'express';

var router = express.Router()

import { log } from 'lib/log-bunyan';
import { clientIdForAlias, handlePollRequest, pushToClient } from 'lib/client';

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
  // TODO
  // const inspect = util.inspect(message);
  const inspect = JSON.stringify(message);
  log.debug(`push object to clientAlias ${clientAlias}, clientId ${clientId}, message ${inspect}`);
  pushToClient(message, clientId, clientAlias);
  res.send({ message: 'done' });
})

export { router as push };
