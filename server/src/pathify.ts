// Pathify server main
// This creates an Express server, installs middleware, configures all the routes, and launches it.
// Note this is currently for development and debug purposes only, not for use by the production app.
// The production web site is not served by this code.

require('module-alias/register'); // for module import alias resolution. See tsconfig.json and package.json

import * as bodyParser from 'body-parser'; // Unbundled from Express as of Express 4
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as https from 'https';
import * as vhttps from 'vhttps';
import * as vhost from 'vhost';

import log from 'shared/log';
// Ensure this applies to all modules (TODO)
import { logBunyan } from 'lib/log-bunyan';
log.useLogger(logBunyan);

import { constants } from 'lib/constants';
import { utils } from 'lib/utils';

const cert = utils.getSecret('pathify-app.crt');
const key = utils.getSecret('pathify.app.key');
const useSecureServer = (cert && key);

const app = express();

app.use(helmet()); // https://expressjs.com/en/advanced/best-practice-security.html#use-helmet

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
})

// NOTE: This must be done BEFORE wiring app.post handler in order to receive anything in req.body!
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '100mb' })); // TODO constant

app.use(cookieParser());

// Log network activity at TRACE level
// const bunyanMiddleware = require('bunyan-middleware'); // logger. has issues with import, but works fine with require.
// app.use(bunyanMiddleware({
//   headerName: 'X-Request-Id',
//   propertyName: 'reqId',
//   logName: 'req_id',
//   logger: log.bunyanLogger,
//   level: 'trace',
//   }
// ))

import { ping } from 'routers/ping';
app.use('/ping', ping);

import { poll } from 'routers/poll';
app.use('/poll', poll);

import { push } from 'routers/push';
app.use('/push', push);

// used for fatal error / server restart
function flushLogsAndExit(msecDelay: number = 1000) {
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

const startServer = () => {
  const allowInsecure = true; // TODO
  const port = constants.defaultPort;
  let server: any;
  let via: string;

  log.info('--------------------------');

  if (useSecureServer) { // but not if running locally
    log.info('Launching securely with https');
    
    log.info('Using subdomain', constants.subdomain);
    // app.use(vhost(constants.subdomain, app));

    const server = vhttps.init();
    server.use(constants.subdomain, { cert, key }, app);
    // server = https.createServer({ cert, key }, app);
    via = 'https';
  } else if (allowInsecure) {
    log.warn('Launching insecure server via http');
    server = app;
    via = 'http';
  }
  if (server) {
    console.log('Server launched at', new Date().toString());
    server.listen(port, () => {
      log.info(`Server listening via ${via}, port ${port}`);
    })
  } else {
    log.error('startServer failed');
  }
}

// Equivalent of main() for the server

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

startServer();

// TODO - experimental timer-based failure injection
//
// setTimeout(() => {
//   throw new Error('timebomb');
// }, 5000)
