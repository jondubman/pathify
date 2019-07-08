// Replacement for console that adds a prefix and handles exceptions.

const appName = 'Pathify'; // TODO belongs in shared constants
let logCount = 0;

const log = {
  levels: ['trace', 'debug', 'info', 'warn', 'error', 'fatalError' ], // from low to high

  // Note this is the only place in the app where console.log is used directly.
  // This is the lower-level function. Normally, use one of log.trace, log.debug, log.info, log.warn, log.error.
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

  fatalError: (...args) => {
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

  useLogger: (logger: any) => {
    log.trace = logger.trace;
    log.debug = logger.debug;
    log.info = logger.info;
    log.warn = logger.warn;
    log.error = logger.error;
    log.fatalError = logger.fatalError;
  },
}

// Handle debug output: Omit logging the include property, which may contain a large volume of data.
export const messageToLog = (message: any) => {
  const messageCopy = { ...message };
  if (messageCopy.params && messageCopy.params.include) {
    messageCopy.params = { ...messageCopy.params };
    messageCopy.params.include = '...';
  }
  return messageCopy;
}

export default log;
