//  Selector functions for Redux reducer

import { getStatusBarHeight } from 'react-native-status-bar-height';

import { AppState } from 'lib/state';
import constants, { MapStyle, TimespanKind, withOpacity } from 'lib/constants';
import utils from 'lib/utils';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import { Timespan, Timespans } from 'containers/TimelineContainer';
import database from 'shared/database';
import locations from 'shared/locations';
import { Activity } from 'shared/activities';
import { MarkEvent } from 'shared/marks';
import { interval, Timepoint, TimeRange } from 'shared/timeseries';
import { continuousTracks, Tracks } from 'shared/tracks';
import { AppStateChange, AppStateChangeEvent } from 'shared/appEvents';

export const activityIncludesMark = (activityId: string, mark: MarkEvent): boolean => {
  const activity = database.activityById(activityId);
  return !!(mark.activityId && activity && mark.activityId === activity.id)
}

export const continuousTrackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, utils.now()];
  return continuousTracks(database.events(), constants.maxTimeGapForContinuousTrack, tr);
}

const colorForAppState = {
  [AppStateChange.NONE]: 'transparent',
  [AppStateChange.STARTUP]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.75), // == ACTIVE
  [AppStateChange.ACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.5),
  [AppStateChange.INACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0),
  [AppStateChange.BACKGROUND]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.3),
}

// Each activityTimespan shows one Activity
const activityTimespans = (state: AppState): Timespans => {
  const activities = database.activities();
  return activities.map((activity: Activity): Timespan => {
    const timespan = {
      kind: TimespanKind.ACTIVITY,
      tr: [activity.tStart, Math.min(activity.tEnd || Infinity, utils.now())],
    } as Timespan;
    if (activity.id === state.options.selectedActivityId) {
      timespan.color = constants.colors.timeline.selectedActivity;
    }
    if (activity.id === state.options.currentActivityId) {
      timespan.color = constants.colors.timeline.currentActivity;
    }
    return timespan;
  })
}

// For debugging, appStateTimespans show appState over time.
const appStateTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  let previousState = AppStateChange.NONE;
  let previousTimepoint: Timepoint = 0;

  const appEvents = database.events().filtered('type == "APP"');
  for (let e of appEvents) {
    const event = e as any as AppStateChangeEvent;
    const { newState, t } = event;
    if (previousState !== AppStateChange.NONE) {
      timespans.push({
        kind: TimespanKind.APP_STATE,
        tr: [previousTimepoint, t],
        color: colorForAppState[previousState],
      })
    }
    previousState = newState;
    previousTimepoint = t;
  }
  // Add a timepsan representing the current state.
  timespans.push({
    kind: TimespanKind.APP_STATE,
    tr: [previousTimepoint, utils.now()],
    color: colorForAppState[previousState],
  })
  return timespans;
}

export const centerline = () => {
  return utils.windowSize().width / 2;
}

export const futureTimespan = (state: AppState): Timespans => {
  const { nowTime } = state.options;
  const timespan: Timespan = {
    kind: TimespanKind.FUTURE,
    tr: [nowTime, nowTime + interval.days(30)],
  }
  return [timespan];
}

export const clockNowMode = (state: AppState): boolean => {
  if (state.flags.timelineNow) {
    return true;
  }
  if (state.flags.timelineScrolling &&
    state.options.refTime >= state.options.timelineRefTime - constants.timing.timelineCloseToNow &&
    state.options.refTime >= utils.now() - constants.timing.timelineCloseToNow) {
    return true;
  }
  return false;
}

export const currentActivity = (state: AppState): Activity | undefined => {
  if (state.options.currentActivityId) {
    return database.activityById(state.options.currentActivityId);
  }
  return undefined;
}

export const currentOrSelectedActivity = (state: AppState): Activity | undefined => {
  return currentActivity(state) || selectedActivity(state);
}

// This is not technically a selector as it doesn't refer to state
export const dynamicAreaTop = (state: AppState): number => (
  constants.safeAreaTop || getStatusBarHeight()
)

export const dynamicClockBottom = (state: AppState): number => (
  dynamicTimelineHeight(state) + constants.refTime.height + 1
)

export const dynamicLowerButtonBase = (state: AppState): number => (
  (state.flags.mapFullScreen ? constants.safeAreaBottom + constants.mapLogoHeight : constants.mapLogoHeight)
)

export const dynamicMapHeight = (state: AppState): number => {
  return utils.windowSize().height - dynamicTimelineHeight(state);
}

export const dynamicTimelineHeight = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    constants.timeline.default.height
)

export const dynamicTimelineScrollWidth = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    utils.windowSize().width * constants.timeline.widthMultiplier
)

export const dynamicTimelineWidth = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    utils.windowSize().width
)

export const dynamicMapStyle = (state: AppState): MapStyle => (
  constants.mapStyles.find((mapStyle: MapStyle) => (mapStyle.name === state.options.mapStyle)) as MapStyle
)

export const mapHidden = (state: AppState): boolean => (
  (dynamicMapStyle(state).url === '' || state.flags.mapDisable)
)

export const mapStyles = (state: AppState): MapStyle[] => (
  constants.mapStyles.filter((mapStyle: MapStyle) => state.flags.allowMapStyleNone || (mapStyle.name !== 'None'))
)

export const menuOpen = (state: AppState): boolean => (
  state.flags.clockMenuOpen || state.flags.helpOpen || state.flags.settingsOpen || state.flags.topMenuOpen
)

// TODO4 cache for performance
export const pulsars = (state: AppState): OptionalPulsars => {
  const pulsars = { ...state.options.pulsars };
  if (state.userLocation) {
    pulsars.userLocation = {
      loc: locations.lonLat(state.userLocation),
      color: constants.colors.user,
      visible: true,
    }
  }
  if (!state.flags.timelineNow && state.flags.showPriorLocation) {
    const { nearTimeThreshold } = constants.timeline;
    const { refTime } = state.options;
    const tMin = refTime - nearTimeThreshold; // TODO this filtering should happen at the lower level
    const tMax = refTime + nearTimeThreshold;
    const locEvent = locations.locEventNearestTimepoint(database.events().filtered('t >= $0 AND t <= $1', tMin, tMax),
                                                        refTime,
                                                        nearTimeThreshold);
    if (locEvent) {
      pulsars.priorLocation = {
        loc: locations.lonLat(locEvent),
        color: constants.colors.byName.red,
        visible: true,
      }
    }
  }
  return pulsars;
}

export const selectedActivity = (state: AppState): Activity | undefined => {
  if (state.options.selectedActivityId) {
    return database.activityById(state.options.selectedActivityId);
  }
  return undefined;
}

export const selectedOrCurrentActivity = (state: AppState): Activity | undefined => {
  return selectedActivity(state) || currentActivity(state);
}

export const timelineTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  timespans.push(...activityTimespans(state));
  if (state.flags.showAppStateTimespans) {
    timespans.push(...appStateTimespans(state));
  }
  timespans.push(...futureTimespan(state));
  return timespans;
}

// value (from logarithmic timeline zoom slider) is between 0 and 1.
// visibleTime is the number of msec shown on the timeline.
export const timelineVisibleTime = (value: number): number => {
  const { zoomLevels } = constants.timeline;
  const maxVisibleTime = zoomLevels[0].visibleTime; // a very large number (billions of msec; ~2.4 billion = 1 month)
  const minVisibleTime = zoomLevels[zoomLevels.length - 1].visibleTime; // a relatively small number (order 10K)
  const logMax = Math.log2(maxVisibleTime); // larger
  const logMin = Math.log2(minVisibleTime); // smaller
  const visibleTime = Math.pow(2, logMax - (logMax - logMin) * value);
  return visibleTime;
}

// value (from logarithmic timeline zoom slider) is between 0 and 1.
// returned number is index for one of the constants.timeline.zoomLevels that's the best fit given this slider value.
export const timelineZoomLevel = (value: number): number => {
  const { zoomLevels } = constants.timeline;
  const visibleTime = timelineVisibleTime(value);
  for (let level = 0; level < zoomLevels.length; level++) {
    if (zoomLevels[level].visibleTime <= Math.round(visibleTime)) {
      return level;
    }
  }
  return 0; // fallback
}
