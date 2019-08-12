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

    popup.contentsStyle = {
      ...popup.contentsStyle,
      top: dynamicAreaTop(state) - constants.activitySummary.itemMargin,
      // TODO subtracting itemMargin here is sort of a trick to tuck the top row's marginTop above the content area.
    },
    popup.style = {
      ...popup.style,
      bottom: utils.windowSize().height - height,
      height,
    }
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
      // Distance calculations
      const partialDistanceMetric = metrics.get(ActivityMetricName.partialDistance)!;
      const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
      const distanceMetric = state.flags.timelineNow ? totalDistanceMetric : partialDistanceMetric;

      // Time calculations
      const timeMetric = metrics.get(ActivityMetricName.partialTime);
      const timeText = timeMetric ?
        utils.msecToString(metrics.get(ActivityMetricName.partialTime)!.value) : '';

      // Speed calculations
      const speedMetric = metrics.get(ActivityMetricName.speed);
      const speedText = (speedMetric === null) ? '' : speedMetric!.text || '';

      const itemContainerStyle = {
        height: constants.activitySummary.itemHeight,
        padding: constants.activitySummary.itemMargin,
        width: '50%',
      }
      const itemStyle = {
        backgroundColor: constants.colors.activitySummary.itemBackground,
        borderRadius: constants.activitySummary.itemBorderRadius,
        height: '100%',
        width: '100%',
      }

      popup.items = [
        ...popup.items,
        {
          displayText: (distanceMetric && distanceMetric.displayText) || '',
          itemContainerStyle,
          itemStyle, // TODO shrink to fit if string is too long
          itemUnderlayColor: constants.colors.byName.blue,
          label: distanceMetric.units || '',
          name: 'distanceLabel',
        },
        {
          displayText: timeText,
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (timeMetric && timeMetric.units) || '',
          name: 'time',
        },
        {
          displayText: speedText,
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (speedMetric && speedMetric.units) || '',
          name: 'speed',
        },
      ]
    }
  } catch (err) {
    log.error('activitySummary', err);
  }
  return popup;
}
