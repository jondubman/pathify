// Handy Optional type definition
export type Optional<T> = T | null;

// constants that are "shared" between app and server code.
const sharedConstants = {
  logScrollEvents: true, // These are a bit of a firehose in the app when you scroll, so generally this is false.
  maxAgeEvents: Infinity, // anything older than this will be ignored (for testing)
  // maxAgeEvents: interval.days(2),
  metrics: {
    speed: {
      maxAgeCurrent: 5000, // msec max age of event to be considered the "current" speed
    },
  },
  paths: {
    maxLineSegmentInMiles: 0.1, // to prevent anomalous data from rendering long bogus diagonal line segments
  },
}

export default sharedConstants;
