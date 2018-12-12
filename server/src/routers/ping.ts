import * as express from 'express';
var router = express.Router()

router.get('/', function (req, res) {
  res.send('pong')
})

router.get('/json', function (req, res) {
  const obj = { ping: 'pong' };
  res.send(obj);
})

export { router as ping };
