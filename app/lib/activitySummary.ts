import {
  MenuItem,
  PopupMenuConfig
} from 'containers/PopupMenusContainer';
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
      // Distance
      const partialDistanceMetric = metrics.get(ActivityMetricName.partialDistance)!;
      const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
      const distanceMetric = timelineNow ? totalDistanceMetric : partialDistanceMetric;

      // Elevation
      const elevationMetric = metrics.get(ActivityMetricName.elevation);
      const partialElevationGainMetric = metrics.get(ActivityMetricName.partialElevationGain);
      const partialElevationLossMetric = metrics.get(ActivityMetricName.partialElevationLoss);
      const totalElevationGainMetric = metrics.get(ActivityMetricName.totalElevationGain);
      const totalElevationLossMetric = metrics.get(ActivityMetricName.totalElevationGain);

      // Mode
      const modeMetric = metrics.get(ActivityMetricName.mode);

      // Time
      const timeMetric = metrics.get(ActivityMetricName.partialTime);
      if (!timeText!) {
        timeText = timeMetric && timeMetric.text ?
                     timeMetric.text : msecToString(metrics.get(ActivityMetricName.partialTime)!.value!);
      }
      // Speed
      const speedMetric = metrics.get(ActivityMetricName.speed);
      const speedText = (speedMetric === null) ? ' ' : speedMetric!.text || ' ';

      const itemContainerStyle = {
        height: constants.activitySummary.itemHeight,
        padding: constants.activitySummary.itemMargin,
        width: '50%',
      }
      const itemBackground = selectedActivity ? constants.colors.activitySummary.itemBackground_selected :
        constants.colors.activitySummary.itemBackground_current;
      const itemStyle = {
        backgroundColor: itemBackground,
        borderRadius: constants.activitySummary.itemBorderRadius,
        height: '100%',
        width: '100%',
      }

      popup.items = [
        ...popup.items,
        {
          displayText: (distanceMetric && distanceMetric.text) || ' ',
          itemContainerStyle,
          itemStyle, // TODO shrink to fit if string is too long
          itemUnderlayColor: constants.colors.byName.blue,
          label: distanceMetric.label || ' ',
          name: MenuItem.DISTANCE,
        },
        {
          displayText: timeText!,
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (timeMetric && timeMetric.label) || ' ',
          name: MenuItem.TIME,
        },
        {
          displayText: speedText,
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (speedMetric && speedMetric.label) || ' ',
          name: MenuItem.SPEED,
        },
        {
          displayText: elevationMetric === null || !elevationMetric!.value ? ' ' : elevationMetric!.value.toString(),
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (elevationMetric && elevationMetric.label) || ' ',
          name: MenuItem.ELEVATION,
        },
        {
          displayText: modeMetric === null ? ' ' : modeMetric!.text!,
          itemContainerStyle,
          itemStyle,
          itemUnderlayColor: constants.colors.byName.blue,
          label: (modeMetric && modeMetric.label) || ' ',
          name: MenuItem.MODE,
        },
      ]
    }
  } catch (err) {
    log.error('activitySummary', err);
  }
  return popup;
}
