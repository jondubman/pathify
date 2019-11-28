// TODO4
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
import database from 'shared/database';
import log from 'shared/log';
import { activityMetrics, ActivityMetrics, ActivityMetricName } from 'shared/metrics';
import { msecToString } from 'shared/units';

export const activityDetails = (state: AppState, activityDetails: PopupMenuConfig): PopupMenuConfig => {
  const popup = { ...activityDetails };
  const { activityDetailsExpanded, timelineNow } = state.flags;
  const { itemsWhenCollapsed, itemsWhenExpanded } = constants.activityDetails;
  try {
    const height = activityDetailsExpanded ?
      constants.activityDetails.heightExpanded + dynamicAreaTop(state)
      :
      constants.activityDetails.heightCollapsed + dynamicAreaTop(state);

    popup.contentsStyle = {
      ...popup.contentsStyle,
      top: dynamicAreaTop(state) - constants.activityDetails.itemMargin,
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
      metrics = activityMetrics(database.events(), selectedActivity.tr, refTime);
    } else if (currentActivity) {
      let tr = { ...currentActivity.tr };
      if (!tr[1]) {
        tr[1] = Math.max(utils.now(), refTime);
      }
      metrics = activityMetrics(database.events(), tr, timelineNow ? tr[1] : refTime);
      if (timelineNow) {
        // special case to ensure time is as current as can be
        timeText = msecToString(Math.max(0, refTime - tr[0]));
      }
    }
    if (metrics) {
      // Distance
      const distanceMetric = metrics.get(ActivityMetricName.distance)!;

      // Elevation
      const elevationMetric = metrics.get(ActivityMetricName.elevation);
      // const elevationGainMetric = metrics.get(ActivityMetricName.elevationGain);
      // const elevationLossMetric = metrics.get(ActivityMetricName.elevationLoss);

      // Mode
      const modeMetric = metrics.get(ActivityMetricName.mode);

      // Time
      const timeMetric = metrics.get(ActivityMetricName.time);
      if (!timeText!) {
        timeText = timeMetric && timeMetric.text ?
                   timeMetric.text : msecToString(metrics.get(ActivityMetricName.time)!.totalValue!);
      }
      // Speed
      const speedMetric = metrics.get(ActivityMetricName.speed);
      const speedText = (speedMetric === null) ? ' ' : speedMetric!.text || ' ';

      // Other metrics
      const eventCountMetric = metrics.get(ActivityMetricName.eventCount);
      const itemContainerStyle = {
        height: constants.activityDetails.itemHeight,
        padding: constants.activityDetails.itemMargin,
        width: '50%',
      }
      const itemBackground = selectedActivity ? constants.colors.activityDetails.itemBackground_selected :
        constants.colors.activityDetails.itemBackground_current;
      const itemStyle = {
        backgroundColor: itemBackground,
        borderRadius: constants.activityDetails.itemBorderRadius,
        height: '100%',
        width: '100%',
      }

      const itemBase = {
        itemContainerStyle,
        itemStyle,
        itemUnderlayColor: constants.colors.byName.blue,
      }
      popup.items = [
        ...popup.items,
        {
          displayText: (distanceMetric && distanceMetric.text) || ' ',
          ...itemBase,
          label: (distanceMetric && distanceMetric.label) || ' ',
          name: MenuItem.DISTANCE,
        },
        {
          displayText: timeText!,
          ...itemBase,
          label: (timeMetric && timeMetric.label) || ' ',
          name: MenuItem.TIME,
        },
        {
          displayText: speedText,
          ...itemBase,
          label: (speedMetric && speedMetric.label) || ' ',
          name: MenuItem.SPEED,
        },
        {
          displayText: elevationMetric === null || !elevationMetric!.partialValue ?
            ' ' : elevationMetric!.partialValue.toString(),
          ...itemBase,
          label: (elevationMetric && elevationMetric.label) || ' ',
          name: MenuItem.ELEVATION,
        },
        {
          displayText: modeMetric === null ? ' ' : modeMetric!.text!,
          ...itemBase,
          label: (modeMetric && modeMetric.label) || ' ',
          name: MenuItem.MODE,
        },
        {
          displayText: (eventCountMetric && eventCountMetric.text) ? eventCountMetric.text : ' ',
          ...itemBase,
          label: (eventCountMetric && eventCountMetric.label) ? eventCountMetric.label : ' ',
          name: MenuItem.EVENT_COUNT
        }
      ].slice(0, activityDetailsExpanded ? itemsWhenExpanded : itemsWhenCollapsed);
    }
  } catch (err) {
    log.error('activityDetails', err);
  }
  return popup;
}
