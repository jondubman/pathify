// Interfaces and constants related to the AppState used by the Redux reducer

import ActivityList from 'presenters/ActivityList'
import TimelineScroll from 'presenters/TimelineScroll'
import { OptionalPulsars } from 'containers/PulsarsContainer';
import {
  ActivityDataExtended,
  ActivityFilter,
  ExportedActivity,
} from 'lib/activities';
import { AppStateChange } from 'lib/appEvents';
import constants from 'lib/constants';
import {
  LocationEvent,
  LonLat,
} from 'lib/locations';
import utils from 'lib/utils';

// Note events and persistent settings are external to this (in Realm) - see database module

// ActivityDataExtended are slightly enhanced versions of a canonical Activity in the Realm DB. Cached for performance.
export interface CacheInfo {
  activities: ActivityDataExtended[];
  populated: boolean;
  refreshCount: number;
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
export type Current = typeof noCurrentLocation; // This is sort of a backwards way of forming a type.

// Note devMode is important. This is always false for a production release, which prevents all remote debugging.
const devMode = __DEV__ ? true : false; // (debug : release)

export const initialAppState = {
  cache: {
    activities: [] as Array<ActivityDataExtended>,
    populated: false,
    refreshCount: 0,
  } as CacheInfo,
  counts: {
    refreshedActivities: 0,
  },
  current: noCurrentLocation, // Most recently received location, currently only used for debugging
  flags: { // boolean (which makes enable, disable, toggle actions meaningful)
    allowMapStyleNone: false, // really only useful for debugging / perf
    activityListScrolling: false, // is the activityList currently actively being scrolled?
    animateMapWhenFollowingPath: true, // animation pans more smoothly
    appActive: false, // relates to OS state of the app. set true on AppStateChange.ACTIVE, else set false
    appStartupCompleted: false, // once true, should never be set to false
    automate: false, // for automated testing TODO
    colorizeActivities: true, // auto-color activities based on their index in the ActivityList
    centerMapContinuously: false, // false means map recentered only when you near the edge (see locWellBounded)
    deleteEventsWhenDeletingActivity: true, // but if "orphaned" events remain, they should not cause issues.
    devMode, // enabled if __DEV__ or develop ENV variable set to true (if launched using Pathify Develop XCode scheme)
    filterActivityList: false, // if true, state.options.activityListFilter is applied (dev only / experimental for now)
    followingPath: false, // is map following prior locations of user on an activity path?
    followingUser: false, // is map following current location of user? (the typical map app follow setting)
    grabBarPressed: false, // grabBar is a full-width horizontal bar for resizing UI
    helpOpen: false, // manually opened by user
    introMode: false, // Intro experience, possibly replayed from Help menu
    labelsEnabled: true, // yellow UI labels (like training wheels) that can be switched on/off on the Help menu
    locationAuthorized: false, // TODO
    logInDebugVersion: true, // typically true
    logInProductionVersion: false, // typically false
    logToDatabase: false, // applies only if logs are enabled in general (see logInDebugVersion, logInProductionVersion)
    mapEnable: false, // if false, map will not be shown at all. Hold off at startup until we know the initialBounds.
    mapMoving: false, // is the map currently moving? (map events determine this)
    mapRendered: false, // set when map has been fully rendered, the first time
    mapReorienting: false, // is the map currently reorienting? (rotating back to North up)
    mapTapped: false, // tapping the map in full screen mode hides the current and past location markers
    recoveryMode: false, // for debugging
    receiveLocations: true, // normally true; if false, incoming geolocations are ignored (useful for testing)
    receiveActivityChangeEvents: true, // TODO
    receiveHeartbeatEvents: false, // TODO
    receiveMotionChangeEvents: false, // TODO
    refreshActivityOnStop: true, // Should refreshActivity be performed after stopActivity? TODO inefficient, fail-safe.
    remoteDebug: false, // if true, app calls in to Pathify server, takes requests and queries; false for public release
    requestedLocationPermission: false, // has it been requested through react-native-background-geolocation
    setPaceAfterStart: true, // whether to manually set pace to moving when enabling background geolocation
    settingsOpen: false, // manually opened by user
    startMenuOpen: false, // if manually opened by user
    showActivityInfo: true, // generally true
    showAllPastLocations: false, // should the app reveal any past locations outside of an activity? generally false
    showCurrentLocation: true, // should the map reveal the location if known; may still be hidden due to mapTapped
    showFutureTimespan: true, // denotes the future - everything to the right of now - on the timeline
    showGrabBar: false, // generally true, enabled on startup
    showPathsOnMap: true, // generally true
    showPastLocation: true, // as a Pulsar on the map, if known, as a blue dot
    showSequentialPaths: true, // show paths prior and subsequent to currently selected path, up to maxDisplayPaths
    showTimelineMarks: false, // generally true
    showTimelineSpans: true, // generally true
    storeAllLocationEvents: false, // should the app store location events outside of activity tracking? generally false
    testMode: false, // if true, location is either turned off or synthesized
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
    activityColorOpacity: 0.25, // for colorizing activities and timeline spans, works with activityColors
    activityListFilter: { // applied if flags.filterActivityList
      excludeOutOfBounds: true,
      includeAll: false,
      includeCurrent: true,
      includeSelected: true,
      strictBoundsCheck: true,
    } as ActivityFilter,
    appBuild: '0', // set on startup in App component
    appVersion: 0, // set on startup in App component
    appState: AppStateChange.STARTUP as AppStateChange,
    automate: false, // whether to run automated tests when app loads
    backTime: now, // time you go back to if you jump to NOW on the Timeline, and then go back
    centerTime: now, // for Timeline's scrollable domain, near or equal to viewTime, set as side effect in setAppOption.
    clientAlias: '', // shorthand way to refer to an development-version app instance for convenience, none by default
    clientId: '', // for dev server, unique per installation of the app, should be resettable
    currentActivityId: null as string | null, // while tracking Activity
    decelerationRate: 1, // for ScrolLViews. Note even zero does not disable momentum scrolling, just tapers it faster.
    grabBarSnapIndex: constants.snapIndex.topButtons, // User can drag bar up and down to reveal more/less UI over map.
    grabBarSnapIndexPreview: constants.snapIndex.topButtons, // same as grabBarSnapIndex, different only while dragging
    introModePage: 0, // current page of swiper for introMode
    mapOpacity: constants.map.default.opacity, // opacity < 1 helps dynamic data and UI stand out. 0 looks like no map!
    mapOpacityPreview: constants.map.default.opacity, // helps eliminate re-rendering while adjusting
    mapStyle: constants.map.default.style, // friendly name that maps to MapBox style URL
    maxDisplayPaths: 12, // including current and selected. Should be even, for symmetry.
    nowTime: now, // obviously out of date quickly in the real world, but updated on clock tick
    nowTimeRounded: now, // updated on timerTick, minus the fractions of a second
    pathColorOpacity: 0.5, // for colorizing paths, works with activityColors
    pulsars: {} as OptionalPulsars, // pulsing colored dots to indicate location on the map
    pausedTime: now, // timepoint where timeline was last paused
    scrollTime: now, // timepoint that changes even as user is scrolling the timeline
    selectedActivityId: null as string | null, // for now, no more than one Activity is 'selected' at a time
    showIntroIfNeeded: false, // so it can be disabled for tests
    startupTime: now, // not persisted, never changed once set
    timelineSpanColorOpacity: 0.5,
    viewTime: now, // By design this remains constant, as scrollTime changes, while user is scrolling the timeline.
    timerTickIntervalMsec: constants.timing.timerTickInterval, // for updating the analog clock, timeline scrollTime, etc.
    timelineZoomValue: constants.timeline.default.zoomValue, // 0 <= value <= 1 (logarithmic, see constants.timeline)
    zoomClockMoved: 0, // amount ZoomClock has been moved up or down
  },
  refs: { // references to React components so they can be called explicitly when needed e.g. for imperative scrolling
    activityList: undefined as ActivityList | undefined,
    timelineScroll: undefined as TimelineScroll | undefined,
  },
  samples: [] as Array<ExportedActivity>,
}

// Canonical interface for AppState, the contents of the Redux store

// TODO for performance enhancement, consider splitting the store to better separate the infrquently updated from that
// which is constantly being updated in real time.

type InitialAppState = typeof initialAppState;
export interface AppState extends InitialAppState {
  timerTickInterval?: number; // returned by setInterval with appIntervalMsec
  userLocation?: LocationEvent; // TODO now redundant; could replace this with equivalent info from state.current
}

// TODO keep in sync with database.SettingsSchema! Each of these must be included in the schema (but not the reverse.)
// Various of the remaining options are essentially constants by another name (for tweaking during development),
// and don't need to be persisted because they don't need to dynamically change in production.

export const persistedFlags = [
  'colorizeActivities',
  'followingPath',
  'followingUser',
  'labelsEnabled',
  'remoteDebug',
  'requestedLocationPermission',
  'showSequentialPaths',
  'timelineNow',
]

export const persistedOptions = [
  'backTime',
  'clientAlias',
  'clientId',
  'currentActivityId',
  'grabBarSnapIndex',
  'mapOpacity',
  'mapStyle',
  'pausedTime',
  'selectedActivityId',
  'timelineZoomValue',
]
