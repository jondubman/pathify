import * as express from 'express';
import util from 'util';

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

router.get('/push', function (req, res) {
  const { clientId, message } = req.query;
  log.debug(`push text clientId ${clientId}, message ${message}`);
  push(message, clientId);
  res.send({ message: 'done' });
})

router.post('/push', function (req, res) {
  const { clientId } = req.query;
  const message = req.body;
  const inspect = util.inspect(message);
  log.debug(`push object to clientId ${clientId}, message ${inspect}`);
  push(message, clientId);
  res.send({ message: 'done' });
})

export { router as poll };
