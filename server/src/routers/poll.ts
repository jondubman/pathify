import * as express from 'express';

var router = express.Router()

import { constants } from 'lib/constants';
import { log } from 'lib/log-bunyan';
import { clientIdForAlias, handlePollRequest, pushToClient } from 'lib/client';

router.get('/', function (req, res) {
  const { clientAlias, clientId, timeout } = req.query;
  const timeoutMsec = timeout || constants.serverPollTimeout;
  log.debug(`poll from clientId ${clientId} (${clientAlias}) timeout=${timeoutMsec}`);
  handlePollRequest(req, res, timeoutMsec);
})

export { router as poll };
