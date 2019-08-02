import timeseries, { GenericEvents, Timepoint, TimeRange, EventType } from './timeseries';
import { LocationEvent } from './locations';
import log from './log';

import { metersToMiles, metersPerSecondToMilesPerHour } from './units';

export enum ActivityMetricName {
  'averageSpeed' = 'averageSpeed',
  'elevation' = 'elevation',
  'eventCount' = 'eventCount',
  'partialDistance' = 'partialDistance',
  'partialTime' = 'partialTime',
  'speed' = 'speed',
  'totalDistance' = 'totalDistance',
  'totalTime' = 'totalTime',
}

export type ActivityMetric = {
  text?: string;
  units?: string;
  value: number;
}

export type ActivityMetrics = Map<ActivityMetricName, ActivityMetric>;

// Compute ActivityMetrics given events, a (minimum) TimeRange to filter them by, and an optional reference timepoint
// (defaulting to end of timeRange) for any metrics that are "up to time t" like the distance traveled 5 minutes
// in to a 20 minute run, for example, which wouldn't be needed to calculate totals like the total distance.
// "partials" are the metrics that depend on t, in contrast to totals.
export const activityMetrics = (events: GenericEvents,
                                timeRange: TimeRange,
                                t: Timepoint = timeRange[1]) : ActivityMetrics => {

  let firstOdo = 0;
  let lastOdo = 0;
  let partialDistance: ActivityMetric | undefined;
  let totalDistance: ActivityMetric | undefined;

  const filterRange = [timeRange[0], Math.max(timeRange[1], t)] as TimeRange; // expand timeRange to cover t if needed
  const activityEvents = timeseries.filterByTime(events, filterRange);

  try {
    for (let i = 0; i < activityEvents.length; i++) {
      const event = activityEvents[i];
      if (event.type === EventType.LOC) {
        const locationEvent = event as LocationEvent;
        if (locationEvent.data.odo) {
          if (!firstOdo) {
            firstOdo = locationEvent.data.odo;
          }
          lastOdo = locationEvent.data.odo;
          if (event.t <= t) {
            partialDistance = {
              units: 'mi',
              value: metersToMiles(lastOdo - firstOdo),
            }
          }
        }
      }
    }
    const totalDistanceMiles = metersToMiles(lastOdo - firstOdo);
    totalDistance = {
      text: totalDistanceMiles.toFixed(2),
      units: 'mi',
      value: totalDistanceMiles,
    }
    if (partialDistance) {
      partialDistance.text = partialDistance.value.toFixed(2);
    }
  } catch (err) {
    log.error('activityMetrics error', err);
  } finally {
    return new Map<ActivityMetricName, ActivityMetric>([
      [ActivityMetricName.eventCount,  { value: activityEvents.length }],
      [ActivityMetricName.partialDistance, partialDistance ? partialDistance : null ],
      [ActivityMetricName.partialTime, { value: t ? t - timeRange[0] : null }],
      [ActivityMetricName.totalDistance, totalDistance ? totalDistance : null],
      [ActivityMetricName.totalTime, { value: timeRange[1] - timeRange[0] }],
    ])
  }
}
