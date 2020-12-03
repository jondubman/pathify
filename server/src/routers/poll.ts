import * as express from 'express';

var router = express.Router()

import { constants } from 'lib/constants';
import log from 'shared/log';
import { handlePollRequest } from 'lib/client';

router.get('/', function (req, res) {
  try {
    const { clientAlias, clientId, timeout } = req.query;
    const timeoutMsec = (timeout && parseInt(timeout.toString())) || constants.serverPollTimeout;
    log.debug(`poll from clientId CID=${clientId} (CA=${clientAlias}) timeout=${timeoutMsec}`);
    handlePollRequest(req, res, timeoutMsec);
  } catch (err) {
    log.warn(`poll error: ${err}`);
  }
})

export { router as poll };
