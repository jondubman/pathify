// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import { initialMenus } from 'containers/PopupMenusContainer';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import utils from "lib/utils";
import { LocationEvent } from 'shared/locations';
import { Activity } from 'shared/marks';

const now = utils.now();

// Note events and persistent settings are external to this (in Realm) - see database module

export const initialAppState = {
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    activityDetailsExpanded: true, // true: activityDetails is expanded, with greater height (false: collapsed)
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    backgroundGeolocation: false, // until enabled
    clockMenuOpen: false, // clockMenu is among the PopupMenus. See initialMenus.
    enableTicks: true, // TODO2
    flag1: false, // TODO2
    flag2: false, // TODO2
    flag3: false, // TODO2
    followingUser: true, // is map following user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpEnabled: false, // Help mode in the app
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    mapDisable: false,
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    receiveLocations: true, // TODO2
    settingsOpen: false, // settings panel visible state
    showActivityDetails: true, // TODO2
    showPathsOnMap: true, // TODO
    showTimelineMarks: true, // TODO2
    showTimelineSpans: true, // TODO2
    tickEvents: false, // whether to store pulse events when timer ticks (helpful for debugging)
    timelineNow: true, // is the timeline continuously scrolling to show the current time? TODO2
    timelineScrolling: false, // is the timeline currently actively being scrolled?
    timelinePinchToZoom: false, // should the timeline component support pinch-to-zoom (which is too hard to control)
    timelineShowContinuousTracks: false, // should the timeline show continuous periods with location data
    trackingActivity: false, // are we currently tracking an Activity? Note: use startTracking, stopTracking AppActions.
  },
  menus: initialMenus,
  options: { // non-boolean
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    currentActivity: null as Activity | null,
    mapOpacity: constants.map.default.opacity,
    mapOpacityPreview: null as number | null, // while adjusting
    mapStyle: constants.map.default.style,
    // now: // TODO really want a single source of truth for this. Only same as refTime in NOW mode.
    pulsars: {} as OptionalPulsars,
    refTime: now,
    startupTime: now,
    timelineRefTime: now, // Note this lags refTime when user is scrolling the timeline, by design.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline refTime, etc.
    selectedActivity: null as Activity | null, // for now, no more than one Activity is 'selected' at a time
    timelineZoomValue: constants.timeline.default.zoomValue, // 0 <= value <= 1 (see constants.timeline for meaning)
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  mapRegion?: Polygon;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent;
}
