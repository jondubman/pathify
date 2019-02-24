// Interfaces and constants related to the AppState used by the reducer

import { Feature } from "@turf/helpers";

import constants from 'lib/constants';
import { LocationEvent } from 'lib/geo'; // TODO update

export interface AppEvent {
  data: object;
  type: string;
  t: number; // timestamp (msec)
  tr: number; // time received by server (msec) | 0
  ts: number; // time sent to server (msec) | 0
}

export enum AppEventType {
  'ACTIVITY_CHANGE' = 'activity',
  'APP_EVENT' = 'app',
  'LOCATION' = 'location',
  'MOTION_CHANGE' = 'motion',
}

// Canonical interface for AppOptions included in AppState.
// AppOptions are modifiable via the API by name. These include, but are not limited to,
// all the options that are modifiable via Settings in the UI.

export interface AppOptions {
  geolocationModeId: number;
  keepMapCenteredWhenFollowing: boolean;
  mapOpacity: number; // 0 to 1
  mapStyle: string;
  refTime: number,
  startupTime: number,
  timerTickIntervalMsec: number;
}
const initialAppOptions: AppOptions = {
  geolocationModeId: 0,
  keepMapCenteredWhenFollowing: true,
  mapOpacity: 0.5,
  mapStyle: constants.map.default.style,
  refTime: Date.now(),
  startupTime: Date.now(),
  timerTickIntervalMsec: 1000, // TODO should probably be more like 1000
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
    helpEnabled: true,
    mapFullScreen: false, // is the map occupying the full screen, with timeline hidden?
    mapMoving: false, // is the map currently moving?
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
  },
  panels: {
    geolocation: { open: false },
    settings: { open: false },
  },
}
export type AppUIState = typeof initialAppUIState;

// Canonical interface for AppState, the contents of the Redux store

export interface AppState {
  loc?: LocationEvent;
  mapRegion: Feature | null;
  options: AppOptions;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  ui: AppUIState;
}

export const initialAppState: AppState = {
  mapRegion: null,
  options: initialAppOptions,
  ui: initialAppUIState,
}
