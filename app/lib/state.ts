// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import { initialMenus } from 'containers/PopupMenusContainer';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import utils from "lib/utils";
import { LocationEvent } from 'shared/locations';
import { Activity } from 'shared/marks';

// const now = /* utils.now() */ 1567890900000; // TODO2
const now = utils.now();

export const initialAppState = {
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    activityDetailsExpanded: true, // true: activityDetails is expanded, with greater height (false: collapsed)
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    backgroundGeolocation: false, // until enabled
    clockMenuOpen: false, // clockMenu is among the PopupMenus. See initialMenus.
    flag1: true, // TODO2
    flag2: false, // TODO2
    flag3: false, // TODO2
    followingUser: true, // is map following user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpEnabled: false, // Help mode in the app
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    receiveLocations: true, // TODO2
    settingsOpen: false, // settings panel visible state
    showActivityDetails: false, // TODO2
    showPathsOnMap: true, // TODO
    showTimelineMarks: true, // TODO2
    showTimelineSpans: true, // TODO2
    tickEvents: false, // whether to store pulse events when timer ticks (helpful for debugging)
    timelineNow: true, // is the timeline continuously scrolling to show the current time? TODO2
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
    pulsars: {} as OptionalPulsars,
    refTime: now,
    startupTime: now,
    timelineRefTime: now,
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
