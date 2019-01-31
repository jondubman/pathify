//  Selector functions for Redux reducer

import { AppState } from 'lib/reducer';
import constants, { MapStyle } from './constants';
import utils from 'lib/utils';

export const dynamicMapHeight = (state: AppState): number => {
  return utils.safeAreaHeight() - dynamicTimelineHeight(state);
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
