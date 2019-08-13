import { PopupMenuConfig } from 'containers/PopupMenusContainer';
import constants from 'lib/constants';
import {
  dynamicAreaTop,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import log from 'shared/log';
import { activityMetrics, ActivityMetrics, ActivityMetricName } from 'shared/metrics';
import { msecToString } from 'shared/units';

export const activitySummary = (state: AppState, activitySummary: PopupMenuConfig): PopupMenuConfig => {
  const popup = { ...activitySummary };
  const { activitySummaryExpanded, timelineNow } = state.flags;
  try {
    const height = activitySummaryExpanded ?
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
    // For now, compute metrics for just the selectedActivity if that exists, else currentActivity, if that exists.
    const { currentActivity, refTime, selectedActivity } = state.options;
    let timeText: string;
    let metrics: ActivityMetrics | null = null;
    if (selectedActivity) {
      metrics = activityMetrics(state.events, selectedActivity.tr, refTime);
    } else if (currentActivity) {
      let tr = { ...currentActivity.tr };
      if (tr[1] === Infinity) {
        tr[1] = Math.max(utils.now(), refTime);
      }
      metrics = activityMetrics(state.events, tr, timelineNow ? tr[1] : refTime); // now means now
      if (timelineNow) {
        // special case to ensure time is as current as can be
        timeText = msecToString(Math.max(0, refTime - tr[0]));
      }
    }
    if (metrics) {
      // Distance calculations
      const partialDistanceMetric = metrics.get(ActivityMetricName.partialDistance)!;
      const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
      const distanceMetric = timelineNow ? totalDistanceMetric : partialDistanceMetric;

      // Time calculations
      const timeMetric = metrics.get(ActivityMetricName.partialTime);
      if (!timeText) {
        timeText = timeMetric && timeMetric.displayText ?
                     timeMetric.displayText : msecToString(metrics.get(ActivityMetricName.partialTime)!.value);
      }
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
