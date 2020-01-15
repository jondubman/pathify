// Selector functions for Redux reducer, plus some other derived quantities not necessarily dependent on Redux state.
import { getStatusBarHeight } from 'react-native-status-bar-height';
// import { createSelector } from 'reselect'

import { AppState } from 'lib/state';
import constants, { MapStyle, TimespanKind, withOpacity } from 'lib/constants';
import database from 'lib/database';
import utils from 'lib/utils';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import { Timespan, Timespans } from 'containers/TimelineContainer';
import locations from 'shared/locations';
import { Activity, ActivityDataExtended } from 'shared/activities';
import log from 'shared/log';
import { MarkEvent } from 'shared/marks';
import { interval, Timepoint, TimeRange } from 'shared/timeseries';
import { continuousTracks, Tracks } from 'shared/tracks';
import { AppStateChange, AppStateChangeEvent } from 'shared/appEvents';
import {
  msecToString,
} from 'shared/units';

// TODO review
export const activityIncludesMark = (activityId: string, mark: MarkEvent): boolean => {
  const activity = database.activityById(activityId);
  return !!(mark.activityId && activity && mark.activityId === activity.id)
}

// TODO review
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

// note this assumes activities exists
export const selectedActivityIndex = (state: AppState) => (
  state.cache.activities!.findIndex((activity: ActivityDataExtended) => activity.id === state.options.selectedActivityId)
)

export const activityIndex = (state: AppState) => (
  (state.cache.activities && state.cache.activities.length) ?
    selectedActivityIndex(state) > -1 ?
      `${selectedActivityIndex(state) + 1}/${state.cache.activities.length}`
      :
      `${state.cache.activities.length}`
    :
    '' // don't bother showing 0
)

// Each activityTimespan shows one Activity
// TODO review
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
// TODO review
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

// cachedActivity by id
export const cachedActivity = (state: AppState, id: string): ActivityDataExtended | undefined => {
  const cache = state.cache;
  if (id && cache.activities) {
    return cache.activities.find(activity => activity.id === id);
  }
  return undefined;
}

export const cachedActivityForTimepoint = (state: AppState, t: Timepoint): ActivityDataExtended | undefined => {
  const cache = state.cache;
  if (cache && cache.activities) {
    const result = cache.activities.find(activity => activity.tStart <= t && (t <= activity.tLast || !activity.tEnd));
    // log.trace('cachedActivityForTimepoint', t, result);
    return result;
  }
  return undefined;
}

export const centerline = () => {
  return utils.windowSize().width / 2;
}

export const futureTimespan = (state: AppState): Timespans => {
  const { nowTime } = state.options;
  const timespan: Timespan = {
    kind: TimespanKind.FUTURE,
    tr: [nowTime, nowTime + interval.days(365)], // a whole year should be sufficient
  }
  return [timespan];
}

export const clockNowMode = (state: AppState): boolean => {
  if (state.flags.timelineNow) {
    return true;
  }
  if (state.flags.timelineScrolling &&
    state.options.scrollTime >= state.options.viewTime - constants.timing.timelineCloseToNow &&
    state.options.scrollTime >= utils.now() - constants.timing.timelineCloseToNow) {
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

export const dynamicMapStyle = (state: AppState): MapStyle => (
  constants.mapStyles.find((mapStyle: MapStyle) => (mapStyle.name === state.options.mapStyle)) as MapStyle
)

export const dynamicTimelineHeight = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    constants.timeline.default.height
)

// pixel width of entire of timeline including off-screen portion
export const dynamicTimelineScrollWidth = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    utils.windowSize().width * constants.timeline.widthMultiplier
)

// pixel width of on-screen portion of timeline
export const dynamicTimelineWidth = (state: AppState): number => (
  state.flags.mapFullScreen ?
    0
    :
    utils.windowSize().width
)

export const dynamicTopBelowButtons = (state: AppState): number => (
  dynamicAreaTop(state) + constants.buttonSize + constants.buttonOffset
)

export const loggableOptions = (state: AppState) => {
  const options = { ...state.options } as any;
  const { displayTimestamp } = utils;
  options.centerTime_ = displayTimestamp(options.centerTime);
  options.nowTime_ = displayTimestamp(options.nowTime);
  options.pausedTime_ = displayTimestamp(options.pausedTime);
  options.scrollTime_ = displayTimestamp(options.scrollTime);
  options.viewTime_ = displayTimestamp(options.viewTime);
  return options;
}

export const mapHidden = (state: AppState): boolean => (
  (dynamicMapStyle(state).url === '' || !state.flags.mapEnable)
)

export const mapPadding = (state: AppState): [number, number] => {
  const horizontal = constants.map.fitBounds.minHorizontalPadding;
  const showActivityList = state.flags.showActivityList && !state.flags.mapFullScreen;
  const showTimeline = state.flags.showTimeline && !state.flags.mapFullScreen;
  const topClearZone = dynamicTopBelowButtons(state)
    + (showActivityList ? 1 : 0) * constants.activityList.height;
  const bottomClearZone = (showTimeline ? 1 : 0) * constants.timeline.default.height;
  const vertical = Math.max(topClearZone, bottomClearZone);
  return [vertical + constants.map.fitBounds.minVerticalPadding, horizontal];
}

export const mapStyles = (state: AppState): MapStyle[] => (
  constants.mapStyles.filter((mapStyle: MapStyle) => state.flags.allowMapStyleNone || (mapStyle.name !== 'None'))
)

export const menuOpen = (state: AppState): boolean => (
  state.flags.clockMenuOpen || state.flags.helpOpen || state.flags.settingsOpen || state.flags.topMenuOpen
)

export const pulsars = (state: AppState): OptionalPulsars => {
  const {
    followingUser,
    mapFullScreen,
    mapTapped,
    showPriorLocation,
    timelineNow,
    trackingActivity,
  } = state.flags;
  const pulsars = { ...state.options.pulsars };
  const { colors } = constants;
  if (state.userLocation && (followingUser || !mapFullScreen || !mapTapped || trackingActivity)) {
    pulsars.userLocation = { // so, hidden only when not following or tracking, in mapFullScreen, with mapTapped...
      loc: [state.userLocation.lon, state.userLocation.lat],
      color: colors.pulsars.userLocation,
      visible: true,
    }
  }
  // always hide prior location in mapFullScreen
  if (showPriorLocation && !mapFullScreen && !timelineNow) {
    const { nearTimeThreshold } = constants.timeline;
    const { scrollTime } = state.options;
    const tMin = scrollTime - nearTimeThreshold; // TODO this filtering should happen at the lower level
    const tMax = scrollTime + nearTimeThreshold;
    const locEvent = locations.locEventNearestTimepoint(database.events().filtered('t >= $0 AND t <= $1', tMin, tMax),
                                                        scrollTime,
                                                        nearTimeThreshold);
    if (locEvent) {
      pulsars.priorLocation = {
        loc: locations.lonLat(locEvent),
        color: colors.pulsars.priorLocation,
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

export const selectedActivityFromCache = (state: AppState): ActivityDataExtended | undefined => {
  if (state.options.selectedActivityId) {
    return cachedActivity(state, state.options.selectedActivityId);
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
  if (state.flags.showFutureTimespan) {
    timespans.push(...futureTimespan(state));
  }
  return timespans;
}

// value (logarithmic) should be between 0 and 1.
// Returned visibleTime is the number of msec to show on the timeline.
export const timelineVisibleTime = (value: number): number => {
  const { zoomLevels } = constants.timeline;
  const maxVisibleTime = zoomLevels[0].visibleTime; // a very large number (billions of msec; ~2.4 billion = 1 month)
  const minVisibleTime = zoomLevels[zoomLevels.length - 1].visibleTime; // a relatively small number (order 10K)
  const logMax = Math.log2(maxVisibleTime); // larger
  const logMin = Math.log2(minVisibleTime); // smaller
  const visibleTime = Math.pow(2, logMax - (logMax - logMin) * value);
  return visibleTime;
}

// value (logarithmic) should be between 0 and 1.
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

// This is the inverse function of timelineVisibleTime, to zoom timeline to show an entire selected activity in context.
export const timelineZoomValue = (visibleTime: number): number => {
  const { activityZoomFactor, zoomLevels } = constants.timeline;
  const maxVisibleTime = zoomLevels[0].visibleTime; // a very large number (billions of msec; ~2.4 billion = 1 month)
  const minVisibleTime = zoomLevels[zoomLevels.length - 1].visibleTime; // a relatively small number (order 10K)
  const logMax = Math.log2(maxVisibleTime); // larger
  const logMin = Math.log2(minVisibleTime); // smaller
  // So far, this is like timelineVisibleTime above. Here we need to bounds check the incoming visibleTime.
  const boundedVisibleTime = Math.min(Math.max(visibleTime, minVisibleTime), maxVisibleTime) * activityZoomFactor;
  // And now, calculate zoomValue, the inverse of the visibleTime calculation in timelineVisibleTime.
  const zoomValue = (logMax - Math.log2(boundedVisibleTime)) / (logMax - logMin);
  return zoomValue;
}

// flavorText goes in RefTime, left of center just under the clock, referring to the current timepoint.
export const flavorText = (state: AppState): string[] => {
  try {
    const { timelineNow, trackingActivity } = state.flags;
    const { currentActivityId, selectedActivityId } = state.options;

    if (timelineNow) {
      if (trackingActivity) {
        return ['NOW', 'TRACKING', 'ACTIVITY'];
      } else {
        return ['NOW'];
      }
    }
    let currentActivitySelected = false;
    if (trackingActivity) {
      if (currentActivityId === selectedActivityId) {
        currentActivitySelected = true;
      }
    }
    const activity = selectedActivityFromCache(state);
    if (activity) {
      const { scrollTime } = state.options;
      if (scrollTime === activity.tStart) {
        return ['PAST ACTIVITY', 'START'];
      }
      if (scrollTime === activity.tLast && !currentActivitySelected) {
        return ['PAST ACTIVITY', 'END'];
      }
      if (activity.tStart && activity.tLast) {
        const midpoint = (activity.tStart + activity.tLast) / 2;
        if (scrollTime === midpoint) {
          return ['PAST ACTIVITY', 'MIDPOINT'];
        }
        if (activity.tTotal) {
          const elapsed = scrollTime - activity.tStart;
          const percentage = (elapsed / activity.tTotal) * 100;
          const digits = (percentage < 2 || percentage > 98) ? 1 : 0; // bit of extra precision at the ends
          if (currentActivitySelected) {
            if (elapsed < interval.second) {
              return ['ACTIVITY', 'START'];
            }
            return [
              'CURRENT ACTIVITY',
              'FROM START',
              `${msecToString(elapsed)}`,
            ]
          } else {
            return [
              percentage.toFixed(digits).toString() + '%',
              'ELAPSED',
              msecToString(elapsed),
            ]
          }
        }
      }
    }
    // TODO could be more specific here. Like, "> 2 days ago"
    return ['PAST'];
  } catch(err) {
    log.warn('flavorText error', err);
    return [''];
  }
}
