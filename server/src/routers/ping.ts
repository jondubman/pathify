import * as express from 'express';
var router = express.Router()

import { log } from 'lib/log-bunyan';

router.get('/', function (req, res) {
  res.send('pong');
  log.debug('ping');
})

router.get('/json', function (req, res) {
  const obj = { ping: 'pong' };
  res.send(obj);
})

export { router as ping };
