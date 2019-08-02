import { PopupMenuConfig } from 'containers/PopupMenusContainer';
import constants from 'lib/constants';
import {
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import log from 'shared/log';
import { activityMetrics, ActivityMetrics, ActivityMetricName } from 'shared/metrics';

export const activitySummary = (state: AppState, activitySummary: PopupMenuConfig): PopupMenuConfig => {
  const popup = { ...activitySummary };
  try {
    const height = state.flags.activitySummaryExpanded ?
      constants.activitySummary.heightExpanded
      :
      constants.activitySummary.heightCollapsed + dynamicAreaTop(state);

    popup.style = {
      ...popup.style,
      bottom: utils.windowSize().height - height,
      height,
    }
    // TODO t is not always refTime in the general case
    const { currentActivity, refTime, selectedActivity } = state.options;
    let metrics: ActivityMetrics | null = null;
    if (selectedActivity) {
      metrics = activityMetrics(state.events, selectedActivity.tr, refTime);
    } else if (currentActivity) {
      metrics = activityMetrics(state.events, currentActivity.tr, refTime);
    }
    if (metrics) {
      const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
      const totalDistanceDisplayText = totalDistanceMetric ?
        totalDistanceMetric.text! + ' ' + totalDistanceMetric.units! : '';

      const partialDistanceMetric = metrics.get(ActivityMetricName.partialDistance)!;
      let partialDistanceDisplayText = '';
      if (partialDistanceMetric) {
        if (!selectedActivity && currentActivity && state.flags.timelineNow) {
          partialDistanceDisplayText = totalDistanceDisplayText;
        } else {
          partialDistanceDisplayText = partialDistanceMetric.text! + ' of ' +
            totalDistanceMetric.text! + ' ' + partialDistanceMetric.units!;
        }
      }
      popup.items = [
        ...popup.items,
        {
          displayText: 'Distance',
          name: 'distanceLabel',
          itemStyle: {
            top: dynamicAreaTop(state),
            left: constants.buttonSize + constants.buttonOffset * 2,
          },
          textStyle: {},
        },
        {
          displayText: partialDistanceDisplayText,
          name: 'compoundDistance',
          itemStyle: {
            top: dynamicAreaTop(state) + 20,
            left: constants.buttonSize + constants.buttonOffset * 2,
          },
          textStyle: {},
        },
      ]
    }
  } catch (err) {
    log.error('activitySummary', err);
  }
  return popup;
}
