import * as express from 'express';
var router = express.Router()

import { log } from 'lib/log-bunyan';

// get ping
router.get('/', function (req, res) {
  res.send('pong');
  log.debug('ping');
})

// api ping/json
router.get('/json', function (req, res) {
  const obj = { ping: 'pong' };
  res.send(obj);
})

// api ping/post
router.post('/post', function (req, res) {
  const obj = req.body;
  res.send(obj);
})

export { router as ping };
