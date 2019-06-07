// Shared constants

const constants = {
  defaultPort: 3000, // for server API (TODO local config)
  locationUpdateMaxAge: 10000, // (msec) location update queue is flushed to server when it reaches this age
  locationUpdateMaxQueueSize: 10, // location update queue is flushed to server when it reaches this count of updates
}

export { constants };
