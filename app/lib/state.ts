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

export interface MenuItem {
  name: string;
  defaultVisible?: boolean;
  displayText: string;
}

export interface Menu {
  items: MenuItem[],
}

export const menus = {
  menuClock: {
    items: [
      { name: 'cancelSelection', displayText: 'Cancel Selection' }, // starts selection process
      { name: 'clearData', displayText: 'Clear data' },
      { name: 'editMark', displayText: 'Edit Mark' },
      { name: 'jumpDateTime', displayText: 'Jump to Date & Time', defaultVisible: true },
      { name: 'markTimepoint', displayText: 'Mark Timepoint', defaultVisible: true },
      { name: 'removeMark', displayText: 'Remove Mark' },
      { name: 'saveTimespan', displayText: 'Save Timespan' },
      { name: 'selectTimespan', displayText: 'Select Timespan', defaultVisible: true }, // starts selection process
      { name: 'zoomTimeline', displayText: 'Zoom Timeline', defaultVisible: true }, // in, out, level, etc.
    ],
  },
  menuNext: {
    items: [
      { name: 'endActivity', displayText: 'End of Activity' },
      { name: 'endTimespan', displayText: 'End of Timespan' },
      { name: 'nextActivity', displayText: 'Next Activity' },
      { name: 'nextMark', displayText: 'Next Mark' },
      { name: 'nextTimespan', displayText: 'Next Timespan' },
      { name: 'now', displayText: 'NOW', defaultVisible: true },
    ],
  },
  menuPrev: {
    items: [
      { name: 'back', displayText: 'Back' }, // to where you were before
      { name: 'prevActivity', displayText: 'Prev Activity' },
      { name: 'prevMark', displayText: 'Previous Mark' },
      { name: 'prevTimespan', displayText: 'Previous Timespan' },
      { name: 'startActivity', displayText: 'Start of Activity' },
      { name: 'startTimespan', displayText: 'Start of Timespan' },
    ],
  },
}

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
    startupAction_clearStorage: true, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    startupAction_loadStorage: false, // whether to load from storage when starting up the app
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    settingsOpen: false, // settings panel visible state
    tickEvents: false, // whether to store pulse events when timer ticks (helpful for debugging)
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
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  userLocation?: LocationEvent;
  mapRegion?: Polygon | undefined;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
}
