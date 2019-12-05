// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import { OptionalPulsars } from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';
import { ActivityDataExtended } from 'shared/activities';
import { LocationEvent } from 'shared/locations';

const now = utils.now();

// Note events and persistent settings are external to this (in Realm) - see database module

export interface CacheInfo {
  activities?: ActivityDataExtended[];
  refreshCount: number;
}

export const initialAppState = {
  cache: {
    refreshCount: 0,
  } as CacheInfo,
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    activityDetailsExpanded: true, // true: activityDetails is expanded, with greater height (false: collapsed)
    allowMapStyleNone: false, // really only useful for debugging / perf
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    backgroundGeolocation: false, // until enabled
    clockMenuOpen: false,
    ticksEnabled: true, // normally true, set false only for testing to disable actions that occur every second
    flag1: false, // for experimentation
    flag2: false, // for experimentation
    flag3: false, // for experimentation
    followingUser: false, // is map following user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpOpen: false, // Help panel
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    mapDisable: false, // if true, map will not be shown at all
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    receiveLocations: true, // normally true; if false, incoming geolocations are ignored (useful for testing)
    settingsOpen: false, // settings panel visible state
    showActivityDetails: false,
    showActivityList: true,
    showAppStateTimespans: false,
    showActivityInfo: true,
    showDebugInfo: false,
    showPathsOnMap: true,
    showPriorLocation: true,
    showTimeline: true,
    showTimelineMarks: false,
    showTimelineSpans: true,
    storeAllLocationEvents: false, // should the app store location events outside of activity tracking?
    timelineNow: true, // is the timeline continuously scrolling to show the current time? TODO2
    timelineScrolling: false, // is the timeline currently actively being scrolled?
    timelinePinchToZoom: false, // should the timeline component support pinch-to-zoom (which is too hard to control)
    timelineShowContinuousTracks: false, // should the timeline show continuous periods with location data
    topMenuOpen: false,
    trackingActivity: false, // are we currently tracking an Activity? Note: use startTracking, stopTracking AppActions.
  },
  options: { // non-boolean
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    currentActivityId: '', // while tracking Activity
    mapOpacity: constants.map.default.opacity,
    mapOpacityPreview: null as number | null, // while adjusting
    mapStyle: constants.map.default.style,
    nowTime: now,
    pulsars: {} as OptionalPulsars,
    pausedTime: now, // timepoint where timeline was last paused
    previouslySelectedActivityId: '', // used to determine whether selectedActivityId has changed
    refTime: now, // timepoint that changes even as user is scrolling the timeline
    selectedActivityId: '', // for now, no more than one Activity is 'selected' at a time
    startupTime: now, // not persisted, never changed once set
    timelineRefTime: now, // By design this remains constant, as refTime changes, while user is scrolling the timeline.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline refTime, etc.
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
