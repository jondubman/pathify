// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import { initialMenus } from 'containers/PopupMenusContainer';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import utils from "lib/utils";
import { LocationEvent } from 'shared/locations';
import { GenericEvents, TimeRange } from 'shared/timeseries';

const now = utils.now();

export const initialAppState = {
  events: [] as GenericEvents,
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    activitySummaryExpanded: false, // true: activitySummary is expanded, with greater height (false: collapsed)
    activitySummaryOpen: false, // activitySummary is among the PopupMenus. See initialMenus.
    allowContinuousTimelineZoom: false, // false: discrete zoom only
    backgroundGeolocation: false, // until enabled
    clockMenuOpen: false, // clockMenu is among the PopupMenus. See initialMenus.
    followingUser: true, // should map follow user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpEnabled: false, // Help mode in the app
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    startupAction_clearStorage: true, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    startupAction_loadStorage: false, // whether to load from storage when starting up the app (if clear is false)
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    settingsOpen: false, // settings panel visible state
    tickEvents: false, // whether to store pulse events when timer ticks (helpful for debugging)
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
  },
  menus: initialMenus,
  options: { // non-boolean
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    currentActivity: null as TimeRange | null,
    mapOpacity: constants.map.default.opacity,
    mapStyle: constants.map.default.style,
    pulsars: {} as OptionalPulsars,
    refTime: now,
    startupTime: now,
    timerTickIntervalMsec: 1000, // once per second, for updating the analog clock, timeline refTime, etc.
    selectedActivity: null as TimeRange | null,
    serverSyncInterval: constants.serverSyncIntervalDefault, // msec, how often to sync with server
    serverSyncTime: 0, // time of last server sync (or 0 if never)
    timelineZoomLevel: constants.timeline.default.zoomLevel,
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  mapRegion?: Polygon;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent;
}
