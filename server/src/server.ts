// Pathify server main

import * as bodyParser from 'body-parser'; // Unbundled from Express as of Express 4
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as helmet from 'helmet';
// import * as https from 'https';
// import * as JSON5 from 'json5'; // extension of JSON with more permissive syntax

const bunyanMiddleware = require('bunyan-middleware');

const constants = require('./constants');
// const database = require('./database');
// const datetime = require('./datetime');
const log = require('./log-bunyan');
// const utils = require('./utils');


const app = express();

app.use(helmet()); // https://expressjs.com/en/advanced/best-practice-security.html#use-helmet

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
})

// NOTE: This must be done BEFORE wiring app.post handler in order to receive anything in req.body!
app.use(bodyParser.json());

app.use(cookieParser());

app.use(bunyanMiddleware({
  headerName: 'X-Request-Id',
  propertyName: 'reqId',
  logName: 'req_id',
  logger: log.bunyanLogger,
  level: 'trace',
  }
))

const ping = require('./routers/ping');
app.use('/ping', ping);

// used for fatal error / server restart
function flushLogsAndExit(msecDelay = 1000) {
  // Note this would exit immediately, omitting logs due to https://github.com/trentm/node-bunyan/issues/95
  // process.exit(1);

  // TODO this seems hackish; would prefer to ensure outgoing logs are flushed first, but that feature is TBD
  // in node-bunyan. In practice, 100 msec seems sufficient; choosing larger default to be safe.

  log.info(`shutting down in ${msecDelay}ms...`);
  setTimeout(() => {
    log.info('shutting down NOW!');
    process.exit(1);
  }, msecDelay);
}

// ---SECTION: Startup

const startExpressServer = () => {
  let server, port, via;
  const secure = false;
  log.info('startExpressServer');
  if (secure) {
    // TODO
  } else {
    log.warn('Server running over insecure http');
    port = constants.DEFAULT_PORT;
    via = 'http';
    server = app;
  }
  server.listen(port, () => {
    log.info(`server listening via ${via}, port ${port}`);
  })
}

// This is called synchronously below. It's only async so it can await.
const startServer = async () => {
  log.info('--------------------------');
  startExpressServer();
}

// ---SECTION: Top-level code

// https://stackoverflow.com/questions/40867345/catch-all-uncaughtexception-for-node-js-app
process
  .on('unhandledRejection', (reason, p) => {
    // log.fatalError(reason, 'Unhandled Rejection at Promise', p);
    log.fatalError(reason, 'Unhandled Rejection at Promise');
    flushLogsAndExit();
  })
  .on('uncaughtException', err => {
    log.fatalError(err, 'Uncaught Exception thrown');
    flushLogsAndExit();
  })

// Important: Actually start the server!

startServer();

// TODO - experimental timer-based failure injection
//
// setTimeout(() => {
//   throw new Error('timebomb');
// }, 5000)
