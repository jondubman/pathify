// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import constants from 'lib/constants';
import { GenericEvent, LocationEvent } from 'shared/timeseries';
import { OptionalPulsars } from 'containers/PulsarsContainer';

// Canonical interface for AppOptions included in AppState
const initialAppOptions = {
  geolocationModeId: 1, // TODO if 0, app should open in ghost mode, but geolocation module is still initialized
  mapOpacity: constants.map.default.opacity,
  mapStyle: constants.map.default.style,
  pulsars: {
  } as OptionalPulsars,
  refTime: constants.startupTime,
  startupTime: constants.startupTime,
  timerTickIntervalMsec: 1000, // once per second, for updating the analog clock, timeline refTime, etc.
  serverSyncInterval: constants.serverSyncIntervalDefault, // msec, how often to sync with server
  serverSyncTime: 0, // time of last server sync (or 0 if never)
  timelineZoomLevel: constants.timeline.default.zoomLevel,
}
export type AppOptions = typeof initialAppOptions;

// Canonical interface for AppUIState included in AppState.
// AppUIState is for transient, UI-related state changes, e.g. for menus.

const initialAppUIState = {
  flags: {
    followingUser: true, // should map follow user?
    keepMapCenteredWhenFollowing: true, // true means continuous. false means map recentered only when you near the edge
    helpEnabled: false,
    mapFullScreen: false, // false means timeline is visible. true means map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
  },
  // panels are subviews that sit above the main (perhaps map) view, which don't have to be modal.
  panels: {
    geolocation: { open: false },
    settings: { open: false },
  },
}
export type AppUIState = typeof initialAppUIState;

// Canonical interface for AppState, the contents of the Redux store

export interface AppState {
  events: GenericEvent[];
  loc?: LocationEvent;
  mapRegion: Polygon | null;
  options: AppOptions;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  ui: AppUIState;
}

export const initialAppState: AppState = {
  events: [],
  mapRegion: null,
  options: initialAppOptions,
  ui: initialAppUIState,
}
