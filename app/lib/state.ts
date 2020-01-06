// Interfaces and constants related to the AppState used by the Redux reducer

import { Polygon } from "@turf/helpers";

import { OptionalPulsars } from 'containers/PulsarsContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';
import { ActivityDataExtended } from 'shared/activities';
import { AppStateChange } from 'shared/appEvents';
import { LocationEvent, LonLat } from 'shared/locations';

const now = utils.now();

// Note events and persistent settings are external to this (in Realm) - see database module

export interface CacheInfo {
  activities?: ActivityDataExtended[];
  populated: boolean;
  refreshCount: number;
}

export interface CountUpdate {
  refreshedActivities?: number;
}

export interface MapRegionUpdate {
  bounds: LonLat[];
  heading: number;
}

export const initialAppState = {
  cache: {
    populated: false,
    refreshCount: 0,
  } as CacheInfo,
  callbacks: {
    activityList: undefined as any,
  },
  counts: {
    refreshedActivities: 0,
  },
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    allowMapStyleNone: false, // really only useful for debugging / perf
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    clockMenuOpen: false,
    flag1: false, // for experimentation
    flag2: false, // for experimentation
    flag3: false, // for experimentation
    followingUser: false, // is map following user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpOpen: false, // Help panel
    logToDatabase: true, // TODO debug only
    mapDisable: false, // if true, map will not be shown at all
    mapFullScreen: false, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapRendered: false, // set when map has been fully rendered
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    recoveryMode: false, // debug only
    receiveLocations: true, // normally true; if false, incoming geolocations are ignored (useful for testing)
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    settingsOpen: false, // settings panel visible state
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    showActivityDetails: false,
    showActivityInfo: true,
    showActivityList: true,
    showAppStateTimespans: false,
    showDebugInfo: false,
    showPathsOnMap: true,
    showPriorLocation: true,
    showTimeline: true,
    showTimelineMarks: false,
    showTimelineSpans: true,
    storeAllLocationEvents: false, // should the app store location events outside of activity tracking?
    ticksEnabled: true, // normally true, set false only for testing to disable actions that occur every second
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
    timelineScrolling: false, // is the timeline currently actively being scrolled?
    timelinePinchToZoom: false, // should the timeline component support pinch-to-zoom (which is too hard to control)
    timelineShowContinuousTracks: false, // should the timeline show continuous periods with location data
    topMenuOpen: false,
    trackingActivity: false, // are we currently tracking an Activity? Note: use startTracking, stopTracking AppActions.
  },
  options: { // non-boolean
    appState: AppStateChange.STARTUP as AppStateChange,
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    currentActivityId: '', // while tracking Activity
    decelerationRate: 0, // for ScrolLViews
    mapOpacity: constants.map.default.opacity,
    mapOpacityPreview: null as number | null, // while adjusting
    mapStyle: constants.map.default.style,
    nowTime: now,
    pulsars: {} as OptionalPulsars,
    pausedTime: now, // timepoint where timeline was last paused
    scrollTime: now, // timepoint that changes even as user is scrolling the timeline
    selectedActivityId: '', // for now, no more than one Activity is 'selected' at a time
    startupTime: now, // not persisted, never changed once set
    viewTime: now, // By design this remains constant, as scrollTime changes, while user is scrolling the timeline.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline scrollTime, etc.
    timelineZoomValue: constants.timeline.default.zoomValue, // 0 <= value <= 1 (logarithmic, see constants.timeline)
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  mapBounds?: LonLat[];
  mapHeading?: number;
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent;
}

// TODO keep in sync with database.SettingsSchema

export const persistedFlags = [
  'followingUser',
  'mapFullScreen',
  'showTimeline',
  'timelineNow',
]

export const persistedOptions = [
  'currentActivityId',
  'mapOpacity',
  'mapStyle',
  'pausedTime',
  'timelineZoomValue',
  'viewTime',
]
