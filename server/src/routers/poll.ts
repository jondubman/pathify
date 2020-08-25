import * as express from 'express';

var router = express.Router()

import { constants } from 'lib/constants';
import log from 'shared/log';
import { handlePollRequest } from 'lib/client';

router.get('/', function (req, res) {
  const { clientAlias, clientId, timeout } = req.query;
  const timeoutMsec = (timeout && parseInt(timeout.toString())) || constants.serverPollTimeout;
  log.debug(`poll from clientId ${clientId} (${clientAlias}) timeout=${timeoutMsec}`);
  handlePollRequest(req, res, timeoutMsec);
})

export { router as poll };
