const constants = {
  appQueryDefaultTimeout: 5000, // amount of time to wait for an app to respond to appQuery before timing out
  defaultPort: 3000, // for server API (TODO local config)
  locationUpdateMaxAge: 10000, // (msec) location update queue is flushed to server when it reaches this age
  locationUpdateMaxQueueSize: 10, // location update queue is flushed to server when it reaches this count of updates
  serverPollTimeout: 10000, // (msec) timeout when calling /poll
}

export { constants };
