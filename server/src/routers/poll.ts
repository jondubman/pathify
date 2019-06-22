import * as express from 'express';

var router = express.Router()

import { constants } from 'lib/constants';
import { log } from 'lib/log-bunyan';
import { clientIdForAlias, handlePollRequest, push } from 'lib/push';

router.get('/', function (req, res) {
  const { clientId, timeout } = req.query;
  const timeoutMsec = timeout || constants.serverPollTimeout;
  log.debug(`poll from clientId ${clientId} timeout ${timeoutMsec}`);
  handlePollRequest(req, res, timeoutMsec);
})

router.get('/push', function (req, res) {
  const { clientAlias, clientId, message } = req.query;
  log.debug(`push text clientAlias ${clientAlias}, clientId ${clientId}, message ${message}`);
  push(message, clientId, clientAlias);
  res.send({ message: 'done' });
})

router.post('/push', function (req, res) {
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
  push(message, clientId, clientAlias);
  res.send({ message: 'done' });
})

export { router as poll };
