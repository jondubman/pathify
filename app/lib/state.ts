// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import constants from 'lib/constants';
import utils from "lib/utils";
import { LonLat, LocationEvent } from 'shared/locations';
import { GenericEvents } from 'shared/timeseries';

export interface OptionalPulsar {
  loc: LonLat;
  color: string;
  visible: boolean;
}

// The key here is any unique string, whih could indicate a kind of pulsar (like 'origin'), or an id
export type OptionalPulsars = { [key: string]: OptionalPulsar }

// Canonical interface for AppUIState included in AppState.
// AppUIState is for transient, UI-related state changes, e.g. for menus.

export const initialAppState = {
  events: [] as GenericEvents,
  flags: { // specifically boolean
    allowContinuousTimelineZoom: false, // false: discrete zoom only
    backgroundGeolocation: false, // until enabled
    followingUser: true, // should map follow user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpEnabled: false,
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    startupAction_loadStorage: true, // whether to load from storage when starting up the app
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    tickEvents: true, // whether to store pulse events when timer ticks (helpful for debugging)
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
  },
  options: {
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    mapOpacity: constants.map.default.opacity,
    mapStyle: constants.map.default.style,
    pulsars: {} as OptionalPulsars,
    refTime: utils.now(),
    startupTime: utils.now(),
    timerTickIntervalMsec: 1000, // once per second, for updating the analog clock, timeline refTime, etc.
    serverSyncInterval: constants.serverSyncIntervalDefault, // msec, how often to sync with server
    serverSyncTime: 0, // time of last server sync (or 0 if never)
    timelineZoomLevel: constants.timeline.default.zoomLevel,
  },
  panels: { // panels are subviews that sit above the main (perhaps map) view, which don't have to be modal.
    geolocation: { open: false },
    settings: { open: false },
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  userLocation?: LocationEvent;
  mapRegion?: Polygon | undefined;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
}
