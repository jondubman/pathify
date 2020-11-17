// Interfaces and constants related to the AppState used by the Redux reducer

import ActivityList from 'presenters/ActivityList'
import TimelineScroll from 'presenters/TimelineScroll'
import { OptionalPulsars } from 'containers/PulsarsContainer';
import { ActivityDataExtended } from 'lib/activities';
import { AppStateChange } from 'lib/appEvents';
import constants from 'lib/constants';
import {
  LocationEvent,
  LonLat,
} from 'lib/locations';
import utils from 'lib/utils';

// Note events and persistent settings are external to this (in Realm) - see database module

export interface CacheInfo {
  activities: ActivityDataExtended[];
  populated: boolean;
  refreshCount: number;
}

export interface MapRegionUpdate {
  bounds: LonLat[];
  heading: number;
  zoomLevel: number;
}

// This is the default, initial Redux state before any saved Settings are restored from Realm.
// See persistedFlags and persistedOptions below.

const now = utils.now();

export const noCurrentLocation = {
  ele: undefined as number | undefined,
  lon: undefined as number | undefined,
  lat: undefined as number | undefined,
  odo: undefined as number | undefined,
  speed: undefined as number | undefined,
  modeNumeric: 0 as number,
  modeTypePrevious: undefined as number | undefined,
  moving: false as boolean,
  t: undefined as number | undefined,
  tChangedMoving: undefined as number | undefined,
}
// current is basically a Redux Store cache of recent values from geolocation callbacks.
// If trackingActivity, much of the same should end up in the Activity's Path.
// TODO persist this across app invocations so ActivityDetails calculates current info (particularly mode) correctly.
// TODO This and state.userLocation are largely redundant, but combining them wouldn't buy much.
export type Current = typeof noCurrentLocation;

const devMode = __DEV__ ? true : false; // (debug : release) TODO

export const initialAppState = {
  cache: {
    activities: [],
    populated: false,
    refreshCount: 0,
  } as CacheInfo,
  counts: {
    refreshedActivities: 0,
  },
  current: noCurrentLocation, // TODO persist last values, restore on restart? Have timestamp.
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    allowMapStyleNone: false, // really only useful for debugging / perf
    activityListScrolling: false, // is the activityList currently actively being scrolled?
    animateMapWhenFollowingPath: true, // animation pans more smoothly
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    appStartupCompleted: false, // once true, should never be set to false
    centerMapContinuously: false, // false means map recentered only when you near the edge (see locWellBounded)
    deleteEventsWhenDeletingActivity: true, // but if "orphaned" events remain, they should not cause issues.
    devMode, // if set to true, app calls in to Pathify server and takes requests and queries; false for public release
    followingPath: false, // is map following prior locations of user on an activity path?
    followingUser: false, // is map following current location of user? (the typical map app follow setting)
    grabBarPressed: false, // grabBar is a full-width horizontal bar for resizing UI
    helpOpen: false, // manually opened by user
    introMode: false, // TODO first run experience, possibly replayed from Help menu
    labelsEnabled: true, // yellow UI labels (like training wheels) that can be switched on/off on the Help menu
    locationAuthorized: false, // TODO
    logInDebugVersion: true, // typically true
    logInProductionVersion: false, // typically false
    logToDatabase: false, // applies only if logs are enabled in general (see logInDebugVersion, logInProductionVersion)
    mapEnable: false, // if false, map will not be shown at all. Hold off at startup until we know the initialBounds.
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapRendered: false, // set when map has been fully rendered, the first time
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    mapTapped: false,
    recoveryMode: false, // for debugging
    receiveLocations: true, // normally true; if false, incoming geolocations are ignored (useful for testing)
    receiveActivityChangeEvents: true, // TODO
    receiveHeartbeatEvents: false, // TODO
    receiveMotionChangeEvents: false, // TODO
    refreshActivityOnStop: true, // Should refreshActivity be performed after stopActivity? TODO inefficient, fail-safe.
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    settingsOpen: false, // manually opened by user
    startMenuOpen: false, // if manually opened by user
    showActivityInfo: true, // generally true
    showAllPastLocations: false, // should the app reveal any past locations outside of an activity? generally false
    showFutureTimespan: true, // denotes the future - everything to the right of now - on the timeline
    showGrabBar: false, // generally true
    showPathsOnMap: true, // generally true
    showPastLocation: true, // as a Pulsar on the map
    showTimelineMarks: false, // generally true
    showTimelineSpans: true, // generally true
    storeAllLocationEvents: false, // should the app store location events outside of activity tracking? generally false
    ticksEnabled: true, // normally true, set false only for testing/profiling to disable actions repeated every second.
    timelineNow: false, // is the timeline continuously scrolling to show the current time?
    timelineScrolling: false, // is the timeline currently actively being scrolled?
    timelinePinchToZoom: false, // should the timeline component support pinch-to-zoom (which is too hard to control)
    topMenuOpen: false, // topMenu is a hamburger menu at the top center of the screen related to ActivityList.
    trackingActivity: false, // are we currently tracking an Activity? Note: use startTracking, stopTracking AppActions.
    zoomClockPressed: false, // relates to PanResponder on the timeline clock
  },
  mapHeading: constants.map.default.heading,
  mapHeadingInitial: null as number | null, // once set, never changes
  mapBounds: constants.map.default.bounds as LonLat[],
  mapBoundsInitial: null as LonLat[] | null, // once set, never changes
  mapZoom: null as number | null,
  mapZoomInitial: null as number | null, // once set, never changes
  // options is used broadly here to mean non-boolean state you can access via setAppOption, appQuery options, etc.
  options: { // Like the flags, these are not necessarily user-configurable.
    appState: AppStateChange.STARTUP as AppStateChange,
    backTime: now, // time you go back to if you jump to NOW on the Timeline, and then go back
    centerTime: now, // for Timeline's scrollable domain, near or equal to viewTime, set as side effect in setAppOption.
    clientAlias: 'app', // TODO use constants
    clientId: '', // TODO
    currentActivityId: null as string | null, // while tracking Activity
    decelerationRate: 1, // for ScrolLViews. Note even zero does not disable momentum scrolling, just tapers it faster.
    grabBarSnapIndex: constants.snapIndex.topButtons, // User can drag bar up and down to reveal more/less UI over map.
    grabBarSnapIndexPreview: constants.snapIndex.topButtons, // same as grabBarSnapIndex, different only while dragging
    introModePage: 0, // current page of swiper for introMode
    mapOpacity: constants.map.default.opacity, // opacity < 1 helps dynamic data and UI stand out. 0 looks like no map!
    mapOpacityPreview: null as number | null, // helps eliminate re-rendering while adjusting
    mapStyle: constants.map.default.style, // friendly name that maps to MapBox style URL
    nowTime: now, // obviously out of date quickly in the real world, but updated on clock tick
    nowTimeRounded: now, // updated on timerTick, minus the fractions of a second
    pulsars: {} as OptionalPulsars, // pulsing colored dots to indicate location on the map
    pausedTime: now, // timepoint where timeline was last paused
    scrollTime: now, // timepoint that changes even as user is scrolling the timeline
    selectedActivityId: null as string | null, // for now, no more than one Activity is 'selected' at a time
    startupTime: now, // not persisted, never changed once set
    viewTime: now, // By design this remains constant, as scrollTime changes, while user is scrolling the timeline.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline scrollTime, etc.
    timelineZoomValue: constants.timeline.default.zoomValue, // 0 <= value <= 1 (logarithmic, see constants.timeline)
    zoomClockMoved: 0, // amount ZoomClock has been moved up or down
  },
  refs: { // references to React components so they can be called explicitly when needed e.g. for imperative scrolling
    activityList: undefined as ActivityList | undefined,
    timelineScroll: undefined as TimelineScroll | undefined,
  },
}

// Canonical interface for AppState, the contents of the Redux store
type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent; // TODO This is now redundant; replace this with equivalent info from state.current.
}

// TODO keep in sync with database.SettingsSchema! Each of these must be included in the schema.

export const persistedFlags = [
  'followingPath',
  'followingUser',
  'labelsEnabled',
  'timelineNow',
]

export const persistedOptions = [
  'backTime',
  'currentActivityId',
  'grabBarSnapIndex',
  'mapOpacity',
  'mapStyle',
  'pausedTime',
  'selectedActivityId',
  'timelineZoomValue',
]
