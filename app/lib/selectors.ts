//  Selector functions for Redux reducer

import { AppState } from 'lib/state';
import constants, { MapStyle, TimespanKind } from 'lib/constants';
import utils from 'lib/utils';
import { Timespan, Timespans } from 'containers/TimelineContainer';

import timeseries, { interval, TimeRange, Tracks } from 'shared/timeseries';

export const continuousTrackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, Date.now()];
  return timeseries.continuousTracks(state.events, constants.maxTimeGapForContinuousTrack, tr);
}

export const customTimespans = (state: AppState): Timespans => {
  const experiment = true; // TODO
  if (experiment) {
    const { refTime, startupTime } = state.options;
    const timespan: Timespan = {
      kind: TimespanKind.other,
      tr: [startupTime, refTime ], // for now just show timespan since the app started up
    }
    return [ timespan ];
  } else {
    return [];
  }
}

export const selectedTimespans = (state: AppState): Timespans => {
  const experiment = true; // TODO
  if (experiment) {
    const { startupTime } = state.options;
    const timespan: Timespan = {
      kind: TimespanKind.selection,
      tr: [startupTime - interval.seconds(10), startupTime + interval.seconds(10)],
    }
    return [timespan];
  } else {
    return [];
  }
}

export const dynamicMapHeight = (state: AppState): number => {
  return utils.windowSize().height - dynamicTimelineHeight(state);
}

export const dynamicTimelineHeight = (state: AppState): number => {
  return state.ui.flags.mapFullScreen ?
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
