import timeseries, { GenericEvents, Timepoint, TimeRange, EventType } from './timeseries';
import { LocationEvent } from './locations';

import { metersToMiles, metersPerSecondToMilesPerHour } from './units';

export enum ActivityMetricName {
  'eventCount' = 'eventCount',
  'partialDistance' = 'partialDistance',
  'partialTime' = 'partialTime',
  'totalDistance' = 'totalDistance',
  'totalTime' = 'totalTime',
}

export type ActivityMetric = any; // TODO could add units, display text etc., possibly for some if not all metrics

export type ActivityMetrics = Map<ActivityMetricName, ActivityMetric>;

// Compute ActivityMetrics given events, a TimeRange to filter them by, and an optional reference timepoint
// (defaulting to end of specify TimeRange) for any metrics that are "up to time t" like the distance traveled 5 minutes
// in to a 20 minute run, for example, which wouldn't be needed to calculate totals like the total distance.
// "partials" are the metrics that depend on t, in contrast to totals.
export const activityMetrics = (events: GenericEvents,
                                timeRange: TimeRange,
                                t: Timepoint = timeRange[1]) : ActivityMetrics => {

  const activityEvents = timeseries.filterByTime(events, timeRange);

  let firstOdo = 0;
  let lastOdo = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.type === EventType.LOC) {
      const locationEvent = event as LocationEvent;
      if (locationEvent.data.odo) {
        if (!firstOdo) {
          firstOdo = locationEvent.data.odo;
        }
        lastOdo = locationEvent.data.odo;
      }
    }
  }
  const totalDistance = metersToMiles(lastOdo - firstOdo);

  return new Map<ActivityMetricName, ActivityMetric>([
    [ActivityMetricName.eventCount, activityEvents.length],
    [ActivityMetricName.partialTime, t - timeRange[0]],
    [ActivityMetricName.totalDistance, totalDistance],
    [ActivityMetricName.totalTime, timeRange[1] - timeRange[0]],
  ])
}
