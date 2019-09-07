//  Selector functions for Redux reducer

import { getStatusBarHeight } from 'react-native-status-bar-height';

import database from 'lib/database';
import { AppState } from 'lib/state';
import constants, { MapStyle, TimespanKind, withOpacity } from 'lib/constants';
import utils from 'lib/utils';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import { Timespan, Timespans } from 'containers/TimelineContainer';

import locations from 'shared/locations';
import { Activity, MarkEvent, MarkType } from 'shared/marks';
import timeseries, { Events, GenericEvent, interval, Timepoint, TimeRange, EventType } from 'shared/timeseries';
import { continuousTracks, Tracks } from 'shared/tracks';
import { AppStateChange, AppStateChangeEvent } from 'shared/appEvents';

export const activityIncludesMark = (activity: Activity | null, mark: MarkEvent): boolean => (
  !!(mark.activityId && activity && mark.activityId === activity.id)
)

export const continuousTrackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, utils.now()];
  return continuousTracks(database.events(), constants.maxTimeGapForContinuousTrack, tr);
}

const colorForAppState = {
  [AppStateChange.NONE]: 'transparent',
  [AppStateChange.STARTUP]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.35), // == ACTIVE
  [AppStateChange.ACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.35),
  [AppStateChange.INACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.25),
  [AppStateChange.BACKGROUND]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.1),
}

// Each activityTimespan shows one Activity
const activityTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  let startTime: Timepoint = 0;
  const markEvents = database.events().filtered('type == "MARK"');
  for (let e of markEvents) {
    const event = e as any as MarkEvent;
    const { t } = event;
    const { subtype } = event;
    if (subtype === MarkType.START) {
      startTime = t;
    }
    if (subtype === MarkType.END) {
      const tr: TimeRange = [startTime, t];
      const timespan = {
        kind: TimespanKind.ACTIVITY,
        tr,
      } as Timespan;
      if (state.options.selectedActivity && timeseries.timeRangesEqual(state.options.selectedActivity.tr, tr)) {
        timespan.color = constants.colors.timeline.selectedActivity;
      }
      if (state.options.currentActivity && state.options.currentActivity.tr[0] == tr[0]) {
        timespan.color = constants.colors.timeline.selectedActivity;
      }
      timespans.push(timespan);
      startTime = 0;
    }
  }
  // Finally, add a timepsan representing the current state, if started.
  if (state.options.currentActivity) {
    timespans.push({
      color: constants.colors.timeline.currentActivity,
      kind: TimespanKind.ACTIVITY,
      tr: [state.options.currentActivity.tr[0], utils.now()],
    })
  }
  return timespans;
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
        tr: [ previousTimepoint, t ],
        color: colorForAppState[previousState],
      })
    }
    previousState = newState;
    previousTimepoint = t;
  }
  // Add a timepsan representing the current state.
  timespans.push({
    kind: TimespanKind.APP_STATE,
    tr: [ previousTimepoint, utils.now() ],
    color: colorForAppState[previousState],
  })
  return timespans;
}

export const customTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  timespans.push(...activityTimespans(state));
  timespans.push(...appStateTimespans(state));
  return timespans;
}

export const currentActivityId = (state: AppState): string | undefined => {
  if (state.options.currentActivity) {
    return state.options.currentActivity.id;
  }
  return undefined;
}

// NOTE: selection here means TimeRange selections, not related to selectedActivity
export const selectionTimespans = (state: AppState): Timespans => {
  const experiment = false; // TODO
  if (experiment) {
    const { startupTime } = state.options;
    const timespan: Timespan = {
      kind: TimespanKind.SELECTION,
      // TODO replace hard-coded selection with real one
      tr: [ startupTime - interval.seconds(20), startupTime - interval.seconds(10) ],
    }
    return [timespan];
  } else {
    return [];
  }
}

// This is not technically a selector as it doesn't refer to state
export const dynamicAreaTop = (state: AppState): number => (
  constants.safeAreaTop || getStatusBarHeight()
)

export const dynamicLowerButtonBase = (state: AppState): number => (
  (state.flags.mapFullScreen ? constants.safeAreaBottom + constants.mapLogoHeight : constants.mapLogoHeight)
)

export const dynamicMapHeight = (state: AppState): number => {
  return utils.windowSize().height - dynamicTimelineHeight(state);
}

export const dynamicTimelineHeight = (state: AppState): number => {
  return state.flags.mapFullScreen ?
    0
    :
    constants.timeline.default.height
}

export const dynamicMapStyle = (state: AppState): MapStyle => (
  constants.mapStyles.find((mapStyle: MapStyle) => (mapStyle.name === state.options.mapStyle)) as MapStyle
)

export const mapHidden = (state: AppState): boolean => (
  (dynamicMapStyle(state).url === '')
)

export const pulsars = (state: AppState): OptionalPulsars => {
  const pulsars = { ...state.options.pulsars };
  if (state.userLocation) {
    pulsars.userLocation = {
      loc: locations.lonLat(state.userLocation),
      color: constants.colors.user,
      visible: true,
    }
  }
  if (!state.flags.timelineNow) {
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
