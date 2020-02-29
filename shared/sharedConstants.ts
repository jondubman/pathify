// Handy Optional type definition
export type Optional<T> = T | null;

// constants that are "shared" between app and server code.
const sharedConstants = {
  logScrollEvents: false, // These are a bit of a firehose in the app when you scroll, so generally this is false.
  maxAgeEvents: Infinity, // anything older than this will be ignored (for testing)
}

export default sharedConstants;
