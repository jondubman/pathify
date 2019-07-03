// Replacement for console that adds a prefix and handles exceptions.

const appName = 'Pathify'; // TODO belongs in shared constants
let logCount = 0;

const log = {
  levels: [ 'trace', 'debug', 'info', 'warn', 'error' ], // from low to high

  // Note this is the only place in the app where console.log is used directly.
  // This is the lower-level function. Normally, use log.info, log.warn or log.error.
  inner: (level = 'info', ...args) => {

    if (!log.levels.includes(level)) {
      log.log('warn', 'app', `....pathify: Invalid log level ${level}`); // recurse one level deep
      level = 'warn'; // assume warn level if level unknown
    }
    try {
      logCount++;
      const logPrefix = `${logCount}${log.dotsFor(level)}${appName} ${level}`;
      console.log(logPrefix, ...args); // prefix enables easy filtering in Console
    } catch (err) {
      console.log(`${appName} log err ${err}`);
    }
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
