// Replacement for console that adds a prefix, logs, caches, handles exceptions and informs subscribers.

import constants from 'lib/constants';
import util from 'util';

// Cached movingTime app logs, kept outside of Redux store to avoid dependency
const logs = [] as any[]; // easy place to dump any accumulated logs
// const logSubscribers = []; // callback functions registered with addSubscriber

const log = {
  // Client using addSubscriber receives console logs thus far, and as each happens from here on out.
  // subscriber should be a function that takes an array of strings.
  // addSubscriber: subscriber => {
  //   logSubscribers.push(subscriber);
  //   // Immediately send all logs accumulated thus far.
  //   subscriber(logs);
  // },

  levels: [ 'trace', 'debug', 'info', 'warn', 'error' ], // from low to high

  // Note this is the only place in the app where console.log is used directly.
  // This is the lower-level function. Normally, use log.info, log.warn or log.error.
  inner: (level = 'info', ...args) => {

    // const isReleaseBuild = !(__DEV__);
    // if (isReleaseBuild && !constants.logInReleaseBuild) {
    //   return; // no-op; completely avoid console logging in release build
    // }
    if (! log.levels.includes(level)) {
      log.log('warn', 'app', `....pathify: Invalid log level ${level}`); // recurse one level deep
      level = 'warn'; // assume warn level if level unknown
    }
    const index = logs.length;
    let logItem;
    try {
      const logPrefix = `${index}${log.dotsFor(level)}${constants.appName} ${level}`;
      console.log(logPrefix, ...args); // prefix enables easy filtering in Console

      const stringifiedArgs = [] as string[];
      for (const arg of args) {
        stringifiedArgs.push(util.inspect(arg));
      }
      logItem = { level, key: index, text: stringifiedArgs.join(' ') };
    } catch (err) {
      console.log(`${constants.appName} log err ${err}`);
    }
    logs.push(logItem); // keep logs around

    // inform all 'subscribers'
    // for (const logSubscriber of logSubscribers) {
    //   logSubscriber([ logItem ]);
    // }
  },

  trace: (...args) => {
    log.inner('trace', ...args);
  },

  debug: (...args) => {
    log.inner('debug', ...args);
  },

  info: (...args) => {
    log.inner('info', ...args);
  },

  warn: (...args) => {
    log.inner('warn', ...args);
  },

  error: (...args) => {
    log.inner('error', ...args);
  },

  // only to mimic console API
  log: (...args) => {
    log.inner('trace', 'other', ...args);
  },

  // Convert trace to '.', debug to '..', info to '...', etc. for easy filtering in Console.
  // (For example, to filter for info or higher, filter for ...pathify)
  dotsFor: level => {
    const dot = '.';
    let index = log.levels.indexOf(level);
    if (index < 0) {
      return '';
    } else {
      let dots = dot;
      while (index--) dots += dot;
      return dots;
    }
  },
}

export default log;
