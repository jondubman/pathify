// Selector functions for Redux reducer, plus some other derived quantities not necessarily dependent on Redux state.
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { createSelector } from 'reselect'

import { OptionalPulsars } from 'containers/PulsarsContainer';
import {
  Activity,
  ActivityDataExtended,
} from 'lib/activities';
import constants, {
  MapStyle,
} from 'lib/constants';
import database from 'lib/database';
import locations, {
  LonLat,
  modeIsMoving,
  ModeType,
  numberToModeType,
} from 'lib/locations';
import { MarkEvent } from 'lib/marks';
import { AppState } from 'lib/state';
import {
  interval,
  Timepoint,
} from 'lib/timeseries';
import {
  msecToString,
} from 'lib/units';
import utils from 'lib/utils';
import log from 'shared/log';

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

export const currentCachedActivity = (state: AppState): ActivityDataExtended | undefined => {
  if (state.options.currentActivityId) {
    return cachedActivity(state, state.options.currentActivityId!);
  }
  return undefined;
}

export const currentOrSelectedActivity = (state: AppState): Activity | undefined => {
  return currentActivity(state) || selectedActivity(state);
}

export const mapIsFullScreen = (state: AppState): boolean => (
  state.options.grabBarSnapIndexPreview === 0
)

// Note this 'selector' does not currently depend on state.
export const dynamicAreaTop = (): number => (
  constants.safeAreaTop || getStatusBarHeight()
)

export const dynamicClockBottom = (state: AppState): number => (
  shouldShowTimeline(state) ? (dynamicTimelineHeight(state) + constants.refTime.height + 1) :
    (constants.safeAreaBottom + constants.refTime.height + 1)
)

export const dynamicRefTimeBottom = (state: AppState): number => (
  dynamicClockBottom(state) - constants.refTime.height
)

// TODO should this be just a constant now?
export const dynamicLowerButtonBase = (state: AppState): number => (
  shouldShowTimeline(state) ? (constants.mapLogoHeight + constants.bottomButtonSpacing)
                            : (constants.safeAreaBottom + constants.mapLogoHeight + constants.bottomButtonSpacing)
)

export const dynamicMapHeight = (state: AppState): number => {
  return utils.windowSize().height;
}

export const dynamicMapStyle = (state: AppState): MapStyle => (
  constants.mapStyles.find((mapStyle: MapStyle) => (mapStyle.name === state.options.mapStyle)) as MapStyle
)

export const dynamicTimelineHeight = (state: AppState): number => (
  !shouldShowTimeline(state) || mapIsFullScreen(state) ?
    0
    :
    constants.timeline.default.height
)

// pixel width of entire of timeline including off-screen portion
// TODO no more reliance on state; used to check shouldShowTimeline
export const dynamicTimelineScrollWidth = (state: AppState): number => (
  utils.windowSize().width * constants.timeline.widthMultiplier
)

// pixel width of on-screen portion of timeline
// TODO no more reliance on state; used to check shouldShowTimeline
export const dynamicTimelineWidth = (state: AppState): number => (
  utils.windowSize().width
)

export const shouldShowActivityList = (state: AppState): boolean => (
  (state.options.grabBarSnapIndexPreview >= constants.snapIndex.activityList)
)

export const shouldShowTimeline = (state: AppState): boolean => (
  shouldShowActivityList(state)
)

export const showActivityDetailsRows = (state: AppState): number => {
  // below ActivityList
  const rows = Math.max(0, state.options.grabBarSnapIndex - constants.snapIndex.activityList);
  return rows;
}

export const showActivityDetailsRowsPreview = (state: AppState): number => {
  // below ActivityList
  const rows = Math.max(0, state.options.grabBarSnapIndexPreview - constants.snapIndex.activityList)
  return rows;
}

export const dynamicTopBelowActivityList = (state: AppState): number => (
  dynamicTopBelowButtons() + (shouldShowActivityList(state) ? constants.activityList.height : 0)
)

export const dynamicTopBelowButtons = (): number => (
  dynamicAreaTop() + constants.buttonSize + constants.buttonOffset * 2
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
  const showActivityList = shouldShowActivityList(state);
  const topClearZone = dynamicTopBelowButtons()
    + (showActivityList ? 1 : 0) * constants.activityList.height;
  const bottomClearZone = constants.timeline.default.height;
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

// This is not currently needed for the production app as locations are generally retrieved from an Activity's Path,
// which is derived from underlying events (mostly, from LocationEvents), and locations outside of an Activity
// are not generally saved or shown in production.
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
export interface PathInfo {
  activity: ActivityDataExtended;
  ele: number; // meters
  index: number; // how many locations into the path is the corresponding timepoint
  length: number;
  loc: LonLat;
  mode: number;
  modeDuration: number; // elapsed time since mode change (or, since start of activity)
  modeTypePrevious: ModeType;
  odo: number; // meters
  speed: number; // meters per second
  t: number; // timepoint for this info
}
export const getScrollTimeRounded = (state: AppState) => utils.roundTime(state.options.scrollTime);
export const getTimelineNow = (state: AppState) => state.flags.timelineNow;
export const getTrackingActivity = (state: AppState) => state.flags.trackingActivity;
const getCachedActivities = (state: AppState) => state.cache.activities;
// PathInfo here means info derived from a Path that includes scrollTime as a timepoint - basically, stats right then.
// getScrollTimeRounded is rounded in order to minimize redundant recalculations, as the clock ticks
// many times per second in timelineNow mode. Path timestamps are rounded for comparison against getScrollTimeRounded.
export const getCachedPathInfo = createSelector(
  [getScrollTimeRounded, getTimelineNow, getTrackingActivity, getCachedActivities],
  (scrollTimeRounded, timelineNow, trackingActivity, cachedActivities): PathInfo | null => {
    try {
      if (!cachedActivities) {
        return null;
      }
      const t = scrollTimeRounded;
      const activity = cachedActivities.find(activity =>
        (activity.tStart <= t) && (!activity.tEnd || (t <= activity.tLast && activity.tEnd))
      )
      if (activity) {
        let length = 0;
        let modeChangeTimepoint = activity.tStart;
        let modeDuration = Math.max(0, t - modeChangeTimepoint);
        let modeTypePrevious = ModeType.UNKNOWN;
        let odo = 0;
        let speed = 0;
        const path = database.pathById(activity.id);
        if (!path) {
          return null;
        }
        length = path.t.length;
        const lastIndex = length - 1; // last valid index into path
        // special case the end
        if ((timelineNow && trackingActivity) || t >= utils.roundTime(path.t[lastIndex])) {
          return {
            activity,
            ele: path.ele[lastIndex],
            index: length,
            length,
            loc: [path.lons[lastIndex], path.lats[lastIndex]] as LonLat,
            mode: path.mode[lastIndex],
            modeDuration,
            modeTypePrevious,
            odo: path.odo[lastIndex],
            speed: path.speed[lastIndex],
            t,
          }
        }
        for (let i = 0; i < lastIndex; i++) {
          // Smoothly (linearly) interpolate between points we know, rounding all times to nearest second.
          const t1 = utils.roundTime(path.t[i]);
          const t2 = utils.roundTime((i === lastIndex - 1) ? activity.tLastLoc! : path.t[i + 1]);
          const mode_t1 = path.mode[i];
          const mode_t2 = path.mode[i + 1];
          const modeType_t1 = mode_t1 ? numberToModeType(mode_t1) : ModeType.UNKNOWN;
          const modeType_t2 = mode_t2 ? numberToModeType(mode_t2) : ModeType.UNKNOWN;
          if (modeIsMoving(modeType_t2) !== modeIsMoving(modeType_t1)) {
            modeChangeTimepoint = t2;
            modeDuration = Math.max(0, t - modeChangeTimepoint); // recalc
            modeTypePrevious = modeType_t1;
          }
          if (t1 <= t && t <= t2) {
            const tDiff = t2 - t1;
            const proportion = (t - t1) / tDiff;

            // interpolate elevation
            const ele1 = path.ele[i];
            const ele2 = path.ele[i + 1];
            const ele = (ele2 - ele1) * proportion + ele1;

            // interpolate location
            const lat1 = path.lats[i];
            const lat2 = path.lats[i + 1];
            const lon1 = path.lons[i];
            const lon2 = path.lons[i + 1];
            const lat = (lat2 - lat1) * proportion + lat1;
            const lon = (lon2 - lon1) * proportion + lon1;

            // interpolate odometer
            const odo1 = path.odo[i];
            const odo2 = path.odo[i + 1];
            odo = (odo2 - odo1) * proportion + odo1;

            // interpolate speed
            const speed1 = path.speed[i];
            const speed2 = path.speed[i + 1];
            speed = (speed2 - speed1) * proportion + speed1;

            return {
              activity,
              ele,
              index: i,
              length,
              loc: [lon, lat] as LonLat,
              mode: mode_t2, // note this is mode_t2 not mode_t1
              modeDuration,
              modeTypePrevious,
              odo,
              speed,
              t,
            }
          } // t between t1 and t2
        } // path loop
        if (t > activity.tLast) { // after end of activity
          const lastEle = path.ele[lastIndex];
          const lastLat = path.lats[lastIndex];
          const lastLon = path.lons[lastIndex];
          const lastMode = path.mode[lastIndex];
          const lastOdo = path.odo[lastIndex];
          return {
            activity,
            ele: lastEle,
            index: length,
            length,
            loc: [lastLon, lastLat],
            mode: lastMode,
            modeDuration,
            modeTypePrevious,
            odo: lastOdo,
            speed,
            t,
          }
        }
      } // if activity
      return null;
    } catch(err) {
      log.warn('Exception in getCachedPathInfo', err);
      return null;
    }
  }
)

export const pulsars = (state: AppState): OptionalPulsars => {
  const {
    followingUser,
    mapTapped,
    showAllPastLocations,
    showPastLocation,
    timelineNow,
    trackingActivity,
  } = state.flags;
  const pulsars = { ...state.options.pulsars };
  const { colors } = constants;
  if (state.userLocation && (followingUser || !mapIsFullScreen(state) || !mapTapped || trackingActivity)) {
    pulsars.userLocation = { // so, hidden only when not following or tracking, in mapFullScreen, with mapTapped...
      loc: [state.userLocation.lon, state.userLocation.lat],
      color: colors.pulsars.userLocation,
      visible: true,
    }
  }
  if (showAllPastLocations || (showPastLocation && !(mapIsFullScreen(state) && mapTapped) && !timelineNow)) {
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

// Layout

// TODO smallest devices (iPhone 5s, 5E) are too short to see the very last row of ActiityDetails with current layout.
// This is not ideal, but there are few of those devices and the view should soon be customizable.
export const maxGrabBarSnapIndex = (): number => (
  (utils.windowSize().height > 600) ? 7 : 6
)

export const snapPositions = (): number[] => {
  const topMin = dynamicAreaTop() + constants.buttonOffset * 2;
  const belowTopButtons = dynamicTopBelowButtons();
  const listDetailsBoundary = belowTopButtons + constants.activityList.height;
  const detailsRowHeight = constants.activityDetails.height;
  const detailsRow1 = listDetailsBoundary + detailsRowHeight;
  const detailsRow2 = detailsRow1 + detailsRowHeight;
  const detailsRow3 = detailsRow2 + detailsRowHeight;
  const detailsRow4 = detailsRow3 + detailsRowHeight;
  const detailsRow5 = detailsRow4 + detailsRowHeight;
  const snapPositions = [
    topMin,
    belowTopButtons,
    listDetailsBoundary,
    detailsRow1,
    detailsRow2,
    detailsRow3,
    detailsRow4,
    detailsRow5,
  ]
  return snapPositions;
}
