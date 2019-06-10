import * as express from 'express';
var router = express.Router()

import { log } from 'lib/log-bunyan';

// get-text ping
router.get('/', function (req, res) {
  res.send('pong');
  log.debug('ping');
})

// get ping/json
router.get('/json', function (req, res) {
  const obj = { ping: 'pong' };
  res.send(obj);
})

// post ping/post
router.post('/post', function (req, res) {
  const obj = req.body;
  res.send(obj);
})

export { router as ping };
