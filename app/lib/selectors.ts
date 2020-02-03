// Selector functions for Redux reducer, plus some other derived quantities not necessarily dependent on Redux state.
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { createSelector } from 'reselect'

import { AppState } from 'lib/state';
import constants, {
  MapStyle,
  TimespanKind,
} from 'lib/constants';
import database from 'lib/database';
import utils from 'lib/utils';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import locations from 'shared/locations';
import {
  Activity,
  ActivityDataExtended,
} from 'shared/activities';
import { LonLat } from 'shared/locations';
import log from 'shared/log';
import { MarkEvent } from 'shared/marks';
import {
  interval,
  Timepoint,
} from 'shared/timeseries';
import {
  metersPerSecondToMinutesPerMile,
  msecToString,
} from 'shared/units';

// TODO review
export const activityIncludesMark = (activityId: string, mark: MarkEvent): boolean => {
  const activity = database.activityById(activityId);
  return !!(mark.activityId && activity && mark.activityId === activity.id)
}

export const selectedActivityIndex = (state: AppState) => (
  state.cache.activities.findIndex((activity: ActivityDataExtended) => activity.id === state.options.selectedActivityId)
)

export const activityIndex = (state: AppState): string => (
  state.cache.activities.length ?
    selectedActivityIndex(state) > -1 ?
      `${selectedActivityIndex(state) + 1}/${state.cache.activities.length}`
      :
      `${state.cache.activities.length}`
    :
    '' // don't bother showing 0
)

// cachedActivity by id
export const cachedActivity = (state: AppState, id: string): ActivityDataExtended | undefined => {
  const cache = state.cache;
  if (id) {
    return cache.activities.find(activity => activity.id === id);
  }
  return undefined;
}

export const cachedActivityForTimepoint = (state: AppState, t: Timepoint): ActivityDataExtended | undefined => {
  const cache = state.cache;
  const result = cache.activities.find(activity => activity.tStart <= t && (t <= activity.tLast || !activity.tEnd));
  return result;
}

export const centerline = () => {
  return utils.windowSize().width / 2;
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

// Note this 'selector' does not currently depend on state.
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

export const showActivityList = (state: AppState): boolean => (
  (state.flags.showActivityList && !state.flags.mapFullScreen)
)

export const dynamicTopBelowActivityList = (state: AppState): number => (
  dynamicTopBelowButtons(state) + (showActivityList(state) ? constants.activityList.height : 0)
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
  state.flags.helpOpen || state.flags.settingsOpen || state.flags.startMenuOpen || state.flags.topMenuOpen
)

export const nextActivity = (state: AppState, t: Timepoint): (ActivityDataExtended | null) => {
  const { activities } = state.cache;
  const length = activities.length;
  if (!activities.length) {
    return null; // no activities
  }
  // if before the first activity
  const firstActivity = activities[0];
  if (firstActivity.tStart < t) {
    return firstActivity;
  }
  // if between activities
  for (let i = 0; i < length - 1; i++) {
    const prev = activities[i];
    const next = activities[i + 1];
    if (prev.tLast <= t && t <= next.tStart) {
      return (prev);
    }
  }
  return null;
}

export const previousActivity = (state: AppState, t: Timepoint): (ActivityDataExtended | null) => {
  const { activities } = state.cache;
  const length = activities.length;
  if (!activities.length) {
    return null; // no activities
  }
  // if between activities
  for (let i = 0; i < length - 1; i++) {
    const prev = activities[i];
    const next = activities[i + 1];
    if (prev.tLast <= t && t <= next.tStart) {
      return (prev);
    }
  }
  // if after the last activity
  const lastActivity = activities[length - 1];
  if (lastActivity.tLast < t) {
    return lastActivity;
  }
  return null;
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

export const currentActivityIsSelected = (state: AppState): boolean => {
  const { currentActivityId, selectedActivityId } = state.options;
  return !!currentActivityId && !!selectedActivityId && (currentActivityId === selectedActivityId);
}

export const selectedOrCurrentActivity = (state: AppState): Activity | undefined => {
  return selectedActivity(state) || currentActivity(state);
}

// If after the last activity, timeGap returned is the time since then, based on state.now.
export const timeGapBetweenActivities = (state: AppState, t: Timepoint): number => {
  const { activities } = state.cache;
  const { nowTime } = state.options;
  if (activities.length < 1) {
    return 0;
  }
  const mostRecentEnd = activities[activities.length - 1].tLast;
  if (t > mostRecentEnd) {
    return (nowTime - mostRecentEnd)
  }
  for (let i = 0; i < activities.length - 1; i++) {
    const prev = activities[i];
    const next = activities[i + 1];
    if (prev.tLast <= t && t <= next.tStart) {
      return (next.tStart - prev.tLast);
    }
  }
  return 0;
}

// value (logarithmic) should be between 0 and 1.
// Returned visibleTime is the number of msec to show on the timeline.
export const timelineVisibleTime = (value: number): number => {
  const { zoomRanges } = constants.timeline;
  const maxVisibleTime = zoomRanges[0].visibleTime; // a very large number (billions of msec; ~2.4 billion = 1 month)
  const minVisibleTime = zoomRanges[zoomRanges.length - 1].visibleTime; // a relatively small number (order 10K)
  const logMax = Math.log2(maxVisibleTime); // larger
  const logMin = Math.log2(minVisibleTime); // smaller
  const visibleTime = Math.pow(2, logMax - (logMax - logMin) * value);
  return visibleTime;
}

// 'Visible' in this case means visible on the Timeline that is rendered into a containing ScrollView, only a portion of
// which is visible to the user at any time. This is used to filter timespans from the Timeline that are out of view.
export const timepointVisibleOnTimeline = (state: AppState, t: Timepoint): boolean => {
  const { centerTime, timelineZoomValue } = state.options;
  const visibleTime = timelineVisibleTime(timelineZoomValue);
  const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
  const tMin = centerTime - scrollableAreaTime / 2;
  const tMax = centerTime + scrollableAreaTime / 2;
  return (tMin <= t && t <= tMax);
}

// value (logarithmic) should be between 0 and 1.
// returned number is index for one of the constants.timeline.zoomRanges that's the best fit given this slider value.
export const timelineZoomLevel = (value: number): number => {
  const { zoomRanges } = constants.timeline;
  const visibleTime = timelineVisibleTime(value);
  for (let level = 0; level < zoomRanges.length; level++) {
    if (zoomRanges[level].visibleTime <= Math.round(visibleTime)) {
      return level;
    }
  }
  return 0; // fallback
}

// This is the inverse function of timelineVisibleTime, to zoom timeline to show an entire selected activity in context.
// TODO automated test of inverse function claim.
export const timelineZoomValue = (visibleTime: number): number => {
  const { activityZoomFactor, zoomRanges } = constants.timeline;
  const maxVisibleTime = zoomRanges[0].visibleTime; // a very large number (billions of msec; ~2.4 billion = 1 month)
  const minVisibleTime = zoomRanges[zoomRanges.length - 1].visibleTime; // a relatively small number (order 10K)
  const logMax = Math.log2(maxVisibleTime); // larger
  const logMin = Math.log2(minVisibleTime); // smaller
  // So far, this is like timelineVisibleTime above. Here we need to bounds check the incoming visibleTime.
  const boundedVisibleTime = Math.min(Math.max(visibleTime, minVisibleTime), maxVisibleTime) * activityZoomFactor;
  // And now, calculate zoomValue, the inverse of the visibleTime calculation in timelineVisibleTime.
  const zoomValue = (logMax - Math.log2(boundedVisibleTime)) / (logMax - logMin);
  return zoomValue;
}

// flavorText goes in RefTime, left of center just under the clock, giving context to scrollTime.
export const flavorText = (state: AppState): string[] => {
  try {
    const { timelineNow, trackingActivity } = state.flags;
    const { currentActivityId, scrollTime, selectedActivityId } = state.options;
    const ago = utils.now() - scrollTime;
    // Check scrollTime in addition to timelineNow to cover scrolling timeline into the future zone.
    if (timelineNow || scrollTime >= utils.now() - constants.timing.timelineCloseToNow) {
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
      const currentOrPastActivity = currentActivitySelected ? 'CURRENT ACTIVITY' : 'PAST ACTIVITY';
      if (scrollTime === activity.tStart) {
        return [currentOrPastActivity, '@ START'];
      }
      if (scrollTime === activity.tLast && !currentActivitySelected) {
        return [currentOrPastActivity, '@ END'];
      }
      if (activity.tStart && activity.tLast) {
        const elapsed = scrollTime - activity.tStart;
        const midpoint = (activity.tStart + activity.tLast) / 2;
        if (scrollTime === midpoint) {
          return [currentOrPastActivity, '@ MIDPOINT', `(${msecToString(elapsed)})`];
        }
        if (activity.tTotal) {
          const percentage = (elapsed / activity.tTotal) * 100;
          const digits = (percentage < 2 || percentage > 98) ? 1 : 0; // bit of extra precision at the ends
          if (currentActivitySelected) {
            if (elapsed < interval.second) {
              return [currentOrPastActivity, '@ START'];
            }
            return [
              currentOrPastActivity,
              `${msecToString(elapsed)} IN`,
              `${msecToString(ago)} AGO`,
            ]
          } else {
            const remaining = activity.tLast - scrollTime;
            return [
              percentage.toFixed(digits).toString() + '% ELAPSED',
              `${msecToString(elapsed)} IN`,
              `${msecToString(remaining)} LEFT`,
            ]
          }
        }
      }
    }
    // TODO could be LESS specific, and in a way, more descriptive here. Like, "> 2 days ago"
    const gap = timeGapBetweenActivities(state, scrollTime);
    const previous = previousActivity(state, scrollTime);
    const gapPercent = ((previous === null) ? '?' : (((scrollTime - previous.tLast) / gap) * 100).toFixed(0));
    return ['PAST', `${msecToString(ago)} AGO`, gap ? `${msecToString(gap)} GAP ${gapPercent}%` : ''];
  } catch(err) {
    log.warn('flavorText error', err);
    return [''];
  }
}

// Selectors memozied using reselect / createSelector:

// Note getScrollTime is used by multiple selectors (getCachedPathInfo, getStoredLocationEvent)
const getScrollTime = (state: AppState) => state.options.scrollTime;
export const getStoredLocationEvent = createSelector(
  [getScrollTime],
  (scrollTime) => {
    const { nearTimeThreshold } = constants.timeline;
    const tMin = scrollTime - nearTimeThreshold; // TODO this filtering should happen at the lower level
    const tMax = scrollTime + nearTimeThreshold;
    return locations.locEventNearestTimepoint(database.events().filtered('t >= $0 AND t <= $1', tMin, tMax),
      scrollTime,
      nearTimeThreshold);
  }
)
const getCachedActivities = (state: AppState) => state.cache.activities;
// PathInfo here means info derived from the Path that includes scrollTime.
export const getCachedPathInfo = createSelector(
  [getScrollTime, getCachedActivities],
  (scrollTime, cachedActivities) => {
    if (!cachedActivities) {
      return null;
    }
    const t = scrollTime;
    let tPaceMeasurement = t - constants.timing.paceMeasurement; // looking for odo just prior to this
    let odoPaceMeasurement = 0;
    let timeAtPaceMeasurement = 0;
    let pace = 0;
    const activity = cachedActivities.find(activity =>
      (activity.tStart <= t) && (!activity.tEnd || (t <= activity.tLast || !activity.tEnd))
    )
    if (activity) {
      const path = database.pathById(activity.id);
      if (!path) {
        return null;
      }
      if (scrollTime >= activity.tLast) {
        const lastIndex = path.t.length - 1;
        const lastEle = path.ele[lastIndex];
        const lastLat = path.lats[lastIndex];
        const lastLon = path.lons[lastIndex];
        const lastOdo = path.odo[lastIndex];
        return {
          activity,
          ele: lastEle,
          loc: [lastLon, lastLat],
          odo: lastOdo,
          pace,
        }
      }
      for (let i = 0; i < path.t.length - 1; i++) {
        // smoothly (linearly) interpolate between points we know
        const t1 = path.t[i];
        const t2 = path.t[i + 1];
        if (t1 >= tPaceMeasurement && !odoPaceMeasurement) {
          odoPaceMeasurement = path.odo[i];
          timeAtPaceMeasurement = path.t[i];
        }
        if (t1 <= t && t <= t2) {
          const tDiff = t2 - t1;
          const proportion = (scrollTime - t1) / tDiff;

          // interpolate elevation
          const ele1 = path.ele[i];
          const ele2 = path.ele[i + 1];
          const ele = (ele2 - ele1) * proportion + ele1;

          // interpolate location
          const lat1 = path.lats[i];
          const lat2 = path.lats[i + 1];
          const lon1 = path.lons[i];
          const lon2 = path.lons[i+1];
          const lat = (lat2 - lat1) * proportion + lat1;
          const lon = (lon2 - lon1) * proportion + lon1;

          // interpolate odometer
          const odo1 = path.odo[i];
          const odo2 = path.odo[i + 1];
          const odo = (odo2 - odo1) * proportion + odo1;

          if (odoPaceMeasurement) {
            const meters = odo - odoPaceMeasurement;
            const seconds = (t - timeAtPaceMeasurement) / 1000;
            pace = meters / seconds;
          }
          return {
            activity,
            ele,
            loc: [lon, lat] as LonLat,
            odo,
            pace,
          }
        }
      }
    }
    return null;
  }
)

export const pulsars = (state: AppState): OptionalPulsars => {
  const {
    followingUser,
    mapFullScreen,
    mapTapped,
    showAllPastLocations,
    showPastLocation,
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
  if (showAllPastLocations || (showPastLocation && !(mapFullScreen && mapTapped) && !timelineNow)) {
    const info = getCachedPathInfo(state);
    if (info) {
      pulsars.pastLocation = {
        loc: info.loc as LonLat,
        color: colors.pulsars.pastLocation,
        visible: true,
      }
    }
  }
  return pulsars;
}

// Note this excludes any currentActivity.
const getSelectedActivityId = (state: AppState) => (
  (state.options.currentActivityId == state.options.selectedActivityId) ? null : state.options.selectedActivityId
)
export const selectedActivityPath = createSelector(
  [getSelectedActivityId],
  (selectedActivityId) => {
    if (!selectedActivityId) {
      return undefined;
    }
    const path = database.pathById(selectedActivityId);
    return path;
  }
)
