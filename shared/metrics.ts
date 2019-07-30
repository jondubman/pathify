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

// Compute ActivityMetrics given events, a TimeRange to filter them by, and an optional reference timepoint
// (defaulting to end of specify TimeRange) for any metrics that are "up to time t" like the distance traveled 5 minutes
// in to a 20 minute run, for example, which wouldn't be needed to calculate totals like the total distance.
// "partials" are the metrics that depend on t, in contrast to totals.
export const activityMetrics = (events: GenericEvents,
                                timeRange: TimeRange,
                                t: Timepoint = timeRange[1]) : ActivityMetrics => {

  let firstOdo = 0;
  let lastOdo = 0;
  let totalDistance: ActivityMetric | undefined;
  const activityEvents = timeseries.filterByTime(events, timeRange);

  try {
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
    const totalDistanceMiles = metersToMiles(lastOdo - firstOdo);
    totalDistance = {
      text: totalDistanceMiles.toFixed(2),
      units: 'mi',
      value: totalDistanceMiles,
    }
  } catch (err) {
    log.error('activityMetrics error', err);
  } finally {
    return new Map<ActivityMetricName, ActivityMetric>([
      [ActivityMetricName.eventCount,  { value: activityEvents.length }],
      [ActivityMetricName.partialTime, { value: t ? t - timeRange[0] : null }],
      [ActivityMetricName.totalDistance, totalDistance ? totalDistance : null],
      [ActivityMetricName.totalTime, { value: timeRange[1] - timeRange[0] }],
    ])
  }
}
