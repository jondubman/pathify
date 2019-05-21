// Interfaces and constants related to the AppState used by the Redux reducer

import { Feature } from "@turf/helpers";

import constants from 'lib/constants';
import { GenericEvent, LocationEvent } from 'shared/timeseries';

// Canonical interface for AppOptions included in AppState.
// AppOptions are potentially modifiable via the API by name, so they need to be the sorts of things one can change
// at any time. These include, but are not limited to, all the options that are modifiable via Settings in the UI.

export interface AppOptions {
  geolocationModeId: number;
  keepMapCenteredWhenFollowing: boolean;
  mapOpacity: number; // 0 to 1
  mapStyle: string;
  refTime: number,
  startupTime: number,
  timerTickIntervalMsec: number;
  serverSyncInterval: number; // msec, how often to sync with server
  serverSyncTime: number; // time of last server sync (or 0 if never)
}
const initialAppOptions: AppOptions = {
  geolocationModeId: 1, // TODO if 0, app should open in ghost mode, but geolocation module is still initialized
  keepMapCenteredWhenFollowing: true,
  mapOpacity: 1, // TODO usual default is 0.5,
  mapStyle: constants.map.default.style,
  refTime: Date.now(),
  startupTime: Date.now(),
  timerTickIntervalMsec: 1000, // once per second, for updating the analog clock, timeline refTime, etc.
  serverSyncInterval: constants.serverSyncIntervalDefault,
  serverSyncTime: 0,
}
export interface AppOption {
  name: string;
  value: any; // could be an object
}

// Canonical interface for AppUIState included in AppState.
// AppUIState is for transient, user-initiated state changes, e.g. for menus.

const initialAppUIState = {
  flags: {
    followingUser: true, // should map follow user?
    helpEnabled: false,
    mapFullScreen: true, // is the map occupying the full screen, with timeline hidden?
    mapMoving: false, // is the map currently moving?
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    timelineNow: false, // is the timeline continuously scrolling to show the current time?
  },
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
  mapRegion: Feature | null;
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
