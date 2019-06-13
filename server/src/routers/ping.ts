import * as express from 'express';
var router = express.Router()

import { log } from 'lib/log-bunyan';

// get-text ping
router.get('/', function (req, res) {
  res.send('pong'); // send as text string (not valid JSON) - OK for simple curl
  log.debug('ping');
})

// get ping/json
router.get('/json', function (req, res) {
  const obj = { ping: 'pong' };
  log.debug('ping/json');
  res.send(obj); // send this canned JSON
})

// post ping/post
router.post('/post', function (req, res) {
  const obj = req.body;
  log.debug('ping/post');
  res.send(obj); // send back whatever we received
})

export { router as ping };
