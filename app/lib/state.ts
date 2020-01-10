// Interfaces and constants related to the AppState used by the Redux reducer

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

export interface MapRegionUpdate {
  bounds: LonLat[];
  heading: number;
  zoomLevel: number;
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
    followingUser: false, // is map following user?
    keepMapCenteredWhenFollowing: false, // true: continuous. false: map recentered only when you near the edge
    helpOpen: false, // Help panel
    logInDebugVersion: true,
    logInProductionVersion: false,
    logToDatabase: false, // applies only if logs are enabled in general (see logInDebugVersion, logInProductionVersion)
    mapEnable: false, // if false, map will not be shown at all. Hold off at startup until we know the initialBounds.
    mapFullScreen: true, // false: timeline is visible. true: map occupies full screen and timeline is hidden
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapRendered: false, // set when map has been fully rendered, the first time
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    mapTapped: false, // tapping the map in mapFullScreen mode hides even the minimal UI, leaving nothing but map/path
    recoveryMode: false, // for debugging
    receiveLocations: true, // normally true; if false, incoming geolocations are ignored (useful for testing)
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    settingsOpen: false, // settings panel visible state
    startupAction_clearStorage: false, // whether to clear storage when starting up the app (NOTE: true is destructive!)
    showActivityDetails: false, // generally false
    showActivityInfo: true, // generally true
    showActivityList: true, // generally true
    showAllPastLocations: false, // should the app reveal any past locations outside of an activity? generally false
    showAppStateTimespans: false, // for debugging
    showDebugInfo: false, // for debugging, obviously
    showPathsOnMap: true, // generally true
    showPriorLocation: true, // as a Pulsar on the map
    showTimeline: true, // generally true
    showTimelineMarks: false, // generally true
    showTimelineSpans: false, // generally true
    storeAllLocationEvents: false, // should the app store location events outside of activity tracking? generally false
    ticksEnabled: true, // normally true, set false only for testing/profiling to disable actions repeated every second.
    timelineNow: true, // is the timeline continuously scrolling to show the current time?
    timelineScrolling: false, // is the timeline currently actively being scrolled?
    timelinePinchToZoom: false, // should the timeline component support pinch-to-zoom (which is too hard to control)
    timelineShowContinuousTracks: false, // should the timeline show continuous periods with location data
    topMenuOpen: false,
    trackingActivity: false, // are we currently tracking an Activity? Note: use startTracking, stopTracking AppActions.
  },
  mapHeading: constants.map.default.heading,
  mapHeadingInitial: null as number | null, // once set, never changes
  mapBounds: constants.map.default.bounds,
  mapBoundsInitial: null as LonLat[] | null, // once set, never changes
  mapZoom: null as number | null,
  mapZoomInitial: null as number | null, // once set, never changes
  // options is used broadly here to mean non-boolean state you can access via setAppOption, appQuery options, etc.
  options: { // Like the flags, these are not necessarily user-configurable.
    appState: AppStateChange.STARTUP as AppStateChange,
    centerTime: now, // for Timeline's scrollable domain, near or equal to viewTime, set as side effect in setAppOption.
    clientAlias: __DEV__ ? 'app' : 'device', // TODO should be unique in production, if specified
    currentActivityId: null as string | null, // while tracking Activity
    decelerationRate: 1, // for ScrolLViews. Note even zero does not disable momentum scrolling, just tapers it faster.
    mapOpacity: constants.map.default.opacity, // opacity < 1 helps dynamic data and UI stand out. 0 looks like no map!
    mapOpacityPreview: null as number | null, // helps eliminate re-rendering while adjusting
    mapStyle: constants.map.default.style, // friendly name that maps to MapBox style URL
    nowTime: now, // obviously out of date quickly in the real world, but updated on clock tick
    pulsars: {} as OptionalPulsars, // pulsing colored dots to indicate location on the map
    pausedTime: now, // timepoint where timeline was last paused
    scrollTime: now, // timepoint that changes even as user is scrolling the timeline
    selectedActivityId: null as string | null, // for now, no more than one Activity is 'selected' at a time
    startupTime: now, // not persisted, never changed once set
    viewTime: now, // By design this remains constant, as scrollTime changes, while user is scrolling the timeline.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline scrollTime, etc.
    timelineZoomValue: constants.timeline.default.zoomValue, // 0 <= value <= 1 (logarithmic, see constants.timeline)
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent;
}

// TODO keep in sync with database.SettingsSchema! Each of these must be included in the schema.

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
