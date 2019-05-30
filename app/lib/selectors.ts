//  Selector functions for Redux reducer

import { AppState } from 'lib/state';
import constants, { MapStyle } from './constants';
import utils from 'lib/utils';

import timeseries, { TimeRange, Tracks } from 'shared/timeseries';

export const dynamicMapHeight = (state: AppState): number => {
  return utils.windowSize().height - dynamicTimelineHeight(state);
}

export const dynamicTimelineHeight = (state: AppState): number => {
  return state.ui.flags.mapFullScreen ?
    0
    :
    constants.timeline.initialHeight
}

export const dynamicMapStyle = (state: AppState): MapStyle => (
  constants.mapStyles.find((mapStyle: MapStyle) => (mapStyle.name === state.options.mapStyle)) as MapStyle
)

export const mapHidden = (state: AppState): boolean => (
  (dynamicMapStyle(state).url === '')
)

export const trackList = (state: AppState): Tracks => {
  const tr: TimeRange = [0, Date.now()];
  return timeseries.continuousTracks(state.events, constants.maxTimeGapForContinuousTrack, tr);
}
