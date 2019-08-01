//  Selector functions for Redux reducer

import { AppState } from 'lib/state';
import constants, { MapStyle, TimespanKind, withOpacity } from 'lib/constants';
import utils from 'lib/utils';
import { OptionalPulsars } from 'containers/PulsarsContainer';
import { Timespan, Timespans } from 'containers/TimelineContainer';

import locations from 'shared/locations';
import { Activity, MarkEvent } from 'shared/marks';
import timeseries, { interval, Timepoint, TimeRange, EventType } from 'shared/timeseries';
import { continuousTracks, Tracks } from 'shared/tracks';
import { AppStateChange, AppStateChangeEvent, AppUserAction, AppUserActionEvent } from 'shared/appEvents';

export const markSelected = (selectedActivity: Activity | null, mark: MarkEvent): boolean => (
  !!(mark.data.id && selectedActivity && mark.data.id === selectedActivity.id)
)

export const continuousTrackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, utils.now()];
  return continuousTracks(state.events, constants.maxTimeGapForContinuousTrack, tr);
}

const colorForAppState = {
  [AppStateChange.NONE]: 'transparent',
  [AppStateChange.STARTUP]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.35), // == ACTIVE
  [AppStateChange.ACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.35),
  [AppStateChange.INACTIVE]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.25),
  [AppStateChange.BACKGROUND]: withOpacity(constants.colors.timeline.timespans[TimespanKind.APP_STATE], 0.1),
}

const activityTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  const { events } = state;
  let startTime: Timepoint = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.type === EventType.USER_ACTION) {
      const { t } = e;
      const { userAction } = (e as AppUserActionEvent).data;
      if (userAction === AppUserAction.START) {
        startTime = t;
      }
      if (userAction === AppUserAction.STOP) {
        const tr: TimeRange = [startTime, t];
        const timespan = {
          kind: TimespanKind.ACTIVITY,
          tr,
        } as Timespan;
        if (state.options.selectedActivity && timeseries.timeRangesEqual(state.options.selectedActivity.tr, tr)) {
          timespan.color = constants.colors.timeline.selectedActivity; // TODO
        }
        timespans.push(timespan);
        startTime = 0;
      }
    }
  }
  // Finally, add a timepsan representing the current state, if started.
  if (startTime) {
    timespans.push({
      kind: TimespanKind.ACTIVITY,
      tr: [startTime, utils.now()],
    })
  }
  return timespans;
}

const appStateTimespans = (state: AppState): Timespans => {
  const timespans: Timespans = [];
  const { events } = state;
  let previousState = AppStateChange.NONE;
  let previousTimepoint: Timepoint = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.type === EventType.APP) {
      const { t } = e;
      const { newState } = (e as AppStateChangeEvent).data;
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

export const selectedTimespans = (state: AppState): Timespans => {
  const experiment = true; // TODO
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

export const dynamicAreaTop = (state: AppState): number => (
  constants.safeAreaTop
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
      loc: state.userLocation.data.loc,
      color: constants.colors.user,
      visible: true,
    }
  }
  if (!state.flags.timelineNow) {
    const loc = locations.locEventNearestTimepoint(state.events,
                                                   state.options.refTime,
                                                   constants.timeline.nearTimeThreshold);
    if (loc) {
      pulsars.priorLocation = {
        loc: loc.data.loc,
        color: constants.colors.byName.red,
        visible: true,
      }
    }
  }
  return pulsars;
}
