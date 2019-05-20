// TODO share this module with the server

interface GenericEventSyncInfo {
  changed?: number; // timestamp if/when last changed. Used locally to identify events to sync with server.
  source?: string; // generally either our own client ID, or something else if from server (like 'server')
}

export interface GenericEvent {
  t: number;
  type: string;
  // subtype?: string;
  data?: object;
  sync?: GenericEventSyncInfo; // undefined for private/local events which do not get uploaded
}

export interface LocationEvent extends GenericEvent {
  data: {
    ele?: number;
    heading?: number;
    lat: number;
    lon: number;
    odo?: number;
    speed?: number;
  }
}

const timeseries = {

  // local/private by default (i.e. not synced with the server)
  // timestamped now unless a timestamp is provided.
  newEvent: (t: number): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      t: timestamp,
      // these are placeholders to be overridden
      type: 'NONE',
      data: {},
    }
  },

  // A synced event will be synchronized with the server (i.e. not private)
  // timestamped now unless a timestamp is provided.
  newSyncedEvent: (t: number): GenericEvent => {
    const timestamp = t || Date.now();
    return {
      ...timeseries.newEvent(timestamp),
      sync: {
        changed: timeseries.uniqify(timestamp), // uniqifying it will facilitate filtering the event list by this value
        source: 'client', // TODO replace with client ID (a UUID) that will differ per app installation
      },
    }
  },

  // Make an integer timestamp (msec precision) 'unique' by adding a random number between 0 and 1 to it.
  // 'uniqified' timepoints make it easier to precisely filter discrete events from the global event list.
  // (Otherwise there might be multiple matches for a given timepoint.)
  // This approach is used to facilitate syncing of changed events, without messing with the canonical timepoint t.
  uniqify: (t: number) => {
    return t + Math.random();
  },
}

export default timeseries;
