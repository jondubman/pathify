import * as bunyan from 'bunyan';
import * as fs from 'fs';

const latestLogFile = './logs/latest.log';
const serverLogfile = './logs/server.log';
const completeLogFile = './logs/complete.log';

// tail -f server.log | bunyan
// `type: 'file'` is implied
// can also leave it open in Sublime Text, clear, save, etc.

// always clear latestLogFile on startup
try {
  fs.unlinkSync(latestLogFile);
} catch (err) { } // we don't care if it fails

const bunyanLogger = bunyan.createLogger({
  name: 'server',
  hostname: 'host', // TODO
  level: 0,
  streams: [{ path: latestLogFile }, { path: serverLogfile }, { path: completeLogFile }],
}) as any;

// map null to 'null' else Bunyan will not show anything at all for null
const nullToString = e => (e === null ? 'null' : e);

const log = {
  bunyanLogger,
  latestLogFile,
  serverLogfile,

  trace: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.trace(...fixedArgs);
  },
  debug: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.debug(...fixedArgs);
  },
  info: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.info(...fixedArgs);
  },
  warn: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.warn(...fixedArgs);
  },
  error: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.error(...fixedArgs);
  },
  fatalError: (...args) => {
    const fixedArgs = args.map(nullToString);
    bunyanLogger.fatal(...fixedArgs);
  },
  // TODO implement in log-winston as well
  exception: (e, message) => log.error({ err: e, message: 'exception: ' + message }),
}

// function testLogging() {
//   log.info(undefined);
//   log.info(null); // TODO this shows as nothing at all; would prefer to see 'null'
//   log.info(false);
//   log.info(true);
//   log.info('this is a test');
//   log.info('this', 'is', 'another', 'test');
//   log.info('hi %s', 'Jonathan'); // uses util.format
//   log.info({a: 123, b: 456});
//   log.info({obj: {x:'foo', y:'bar'}});

//   log.trace('some trace message');
//   log.debug('some debug message');
//   log.warn('some warning message');
//   log.error('some error message');
//   log.fatalError('some fatal error message');
// }

// testLogging();

export { log };
