//  Selector functions for Redux reducer

import { AppState, OptionalPulsars } from 'lib/state';
import constants, { MapStyle, TimespanKind } from 'lib/constants';
import utils from 'lib/utils';
import { Timespan, Timespans } from 'containers/TimelineContainer';

import locations from 'shared/locations';
import { interval, TimeRange } from 'shared/timeseries';
import { continuousTracks, Tracks } from 'shared/tracks';

export const continuousTrackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, utils.now()];
  return continuousTracks(state.events, constants.maxTimeGapForContinuousTrack, tr);
}

export const customTimespans = (state: AppState): Timespans => {
  const experiment = true; // TODO
  if (experiment) {
    const { refTime, startupTime } = state.options;
    const timespan: Timespan = {
      kind: TimespanKind.other,
      tr: [ startupTime, refTime ], // for now just show timespan since the app started up
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
      tr: [ startupTime - interval.seconds(10), startupTime + interval.seconds(10) ],
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

export const pulsars = (state: AppState): OptionalPulsars => {
  const pulsars = { ...state.options.pulsars };
  if (state.userLocation) {
    pulsars.userLocation = {
      loc: state.userLocation.data.loc,
      color: constants.colors.user,
      visible: true,
    }
  }
  if (!state.ui.flags.timelineNow) {
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
