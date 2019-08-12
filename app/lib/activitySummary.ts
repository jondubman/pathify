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
      const { width } = utils.windowSize();
      const center = width / 2;
      const leftMargin = constants.buttonSize + constants.buttonOffset * 2;
      const { lineSpacing } = constants.activitySummary;
      const top = dynamicAreaTop(state);
      const left = 0;

      // positions for metrics shown inside the activitySummary
      const rowGap = lineSpacing * 3.25;
      const positions = [ // [left, top] relative to top left of entire activitySummary
        [leftMargin, 0],
        [center, 0],
        [leftMargin, rowGap],
        [center, rowGap],
      ]
      const position = (x: number, y: number) => ({
        left: left + positions[x][0],
        top: top + positions[y][1],
      })
      const below = (style: any) => ({
        left: style.left || undefined,
        right: style.right || undefined,
        top: style.top + lineSpacing,
      })

      // Distance calculations
      const partialDistanceMetric = metrics.get(ActivityMetricName.partialDistance)!;
      const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
      const distanceMetric = state.flags.timelineNow ? totalDistanceMetric : partialDistanceMetric;

      // Time calculations
      const timeText = metrics.get(ActivityMetricName.totalTime) ?
        utils.msecToString(metrics.get(ActivityMetricName.totalTime)!.value) : '';

      // Speed calculations
      const speedMetric = metrics.get(ActivityMetricName.speed);
      const speedText = (speedMetric === null) ? '' : `${speedMetric!.text} ${speedMetric!.units}`;

      popup.items = [
        ...popup.items,

        // Distance: X of Y mi
        {
          displayText: distanceMetric.displayText ? 'Distance' : '',
          name: 'distanceLabel',
          itemStyle: position(0, 0),
          textStyle: { },
        },
        {
          displayText: distanceMetric.displayText || '',
          name: 'distance',
          itemStyle: below(position(0, 0)),
          textStyle: {},
        },

        // Time: HR:MIN:SEC (use dynamic formatting for time)
        {
          displayText: 'Time',
          name: 'timeLabel',
          itemStyle: position(1, 1),
          textStyle: { },
        },
        {
          displayText: timeText,
          name: 'time',
          itemStyle: below(position(1, 1)),
          textStyle: { },
        },

        // Speed: ##.## mph
        {
          displayText: 'Speed',
          name: 'speedLabel',
          itemStyle: position(2, 2),
          textStyle: {},
        },
        {
          displayText: speedText,
          name: 'speed',
          itemStyle: below(position(2, 2)),
          textStyle: {},
        },
      ]
    }
  } catch (err) {
    log.error('activitySummary', err);
  }
  return popup;
}
