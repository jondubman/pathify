import * as express from 'express';
var router = express.Router()

router.get('/', function (req, res) {
  res.send('pong')
})

export { router as ping };
