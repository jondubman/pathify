const sharedConstants = {
  containingActivityTimeThreshold: 5000, // msec
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
