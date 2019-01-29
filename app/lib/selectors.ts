//  Selector functions for Redux reducer

import { AppState } from 'lib/reducer';
import constants from './constants';
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
