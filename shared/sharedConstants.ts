// TODO where does this belong?
export type Optional<T> = T | null; // TODO This simple construct is very generally useful and belongs in shared code.

const sharedConstants = {
  maxAgeEvents: Infinity, // anything older than this will be ignored (for testing)
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
