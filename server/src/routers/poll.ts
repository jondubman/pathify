import * as express from 'express';
var router = express.Router()

import { constants } from 'lib/constants';
import { log } from 'lib/log-bunyan';
import { handlePollRequest, push } from 'lib/push';

router.get('/', function (req, res) {
  const { clientId, timeout } = req.query;
  const timeoutMsec = timeout || constants.serverPollTimeout;
  log.debug(`poll from clientId ${clientId} timeout ${timeoutMsec}`);
  handlePollRequest(req, res, timeoutMsec);
})

router.get('/test', function (req, res) {
  const { clientId, message } = req.query;
  log.debug(`poll test for clientId ${clientId}, message ${message}`);
  push(message, clientId);
  res.send({ message: 'done' });
})

export { router as poll };