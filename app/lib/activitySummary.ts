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
      let tr = { ...currentActivity.tr };
      if (tr[1] === Infinity) {
        tr[1] = utils.now(); // TODO maybe turn this into a utility function
      }
      metrics = activityMetrics(state.events, tr, refTime);
    }
    if (metrics) {
      const leftMargin = constants.buttonSize + constants.buttonOffset * 2;
      const center = utils.windowSize().width / 2;
      // positions for metrics shown inside the activitySummary
      const positions = [ // [left, top] relative to top left of entire activitySummary
        [leftMargin, 0],
        [center, 0],
      ]
      const top = dynamicAreaTop(state);
      const left = 0;
      const { lineSpacing } = constants.activitySummary;

      // Distance calculations

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
      const timeText = metrics.get(ActivityMetricName.totalTime) ?
        utils.msecToString(metrics.get(ActivityMetricName.totalTime)!.value) : '';

      popup.items = [
        ...popup.items,

        // Distance: X of Y mi
        {
          displayText: 'Distance',
          name: 'distanceLabel',
          itemStyle: {
            left: left + positions[0][0],
            top: top + positions[0][1],
          },
          textStyle: {},
        },
        {
          displayText: partialDistanceDisplayText,
          name: 'compoundDistance',
          itemStyle: {
            left: left + positions[0][0],
            top: top + positions[0][1] + lineSpacing,
          },
          textStyle: {},
        },

        // Time: HR:MIN:SEC (use dynamic formatting for time)
        {
          displayText: 'Time',
            name: 'timeLabel',
              itemStyle: {
              left: left + positions[1][0],
              top: top + positions[1][1],
            },
          textStyle: { },
        },
        {
          displayText: timeText,
            name: 'timeMetric',
            itemStyle: {
              left: left + positions[1][0],
              top: top + positions[1][1] + lineSpacing,
            },
          textStyle: { },
        },
      ]
    }
  } catch (err) {
    log.error('activitySummary', err);
  }
  return popup;
}
