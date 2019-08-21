import timeseries, {
  GenericEvents,
  Timepoint,
  TimeRange,
  EventType
} from './timeseries';
import {
  LocationEvent,
  ModeChangeEvent,
  ModeType
} from './locations';
import log from './log';
import sharedConstants from './sharedConstants';

import { metersToFeet, metersToMiles, msecToString } from './units';

// These are camel case rather than upper case simply as a stylistic preference.
// ActivityMetricName is the way to refer to a particular metric, but such a name is not a guarantee that it must exist.
export enum ActivityMetricName {
  'distance' = 'distance',
  'elevation' = 'elevation',
  'elevationGain' = 'elevationGain',
  'elevationLoss' = 'elevationLoss',
  'eventCount' = 'eventCount',
  'minPace' = 'minPace',
  'mode' = 'mode',
  'movingTime' = 'movingTime',
  'pace' = 'pace',
  'paceLastTenSeconds' = 'paceLastTenSeconds',
  'paceLastMinute' = 'paceLastMinute',
  'paceLastMile' = 'paceLastMile',
  'stoppedTime' = 'stoppedTime',
  'speed' = 'speed',
  'time' = 'time',
}

export type ActivityMetric = { // example:
  average?: number;            // over entire activity
  label?: string;              // 'mi'
  max?: number;                // over entire activity
  min?: number;                // over entire activity
  text?: string;               // '4.5'
  partialValue?: number;       // 3.2 (if like 3.2/4.5 miles)
  totalValue?: number;         // 4.5
}

type Optional<T> = T | null; // TODO This simple construct is very generally useful and belongs in shared code.
export type ActivityMetrics = Map<ActivityMetricName, Optional<ActivityMetric>>;

// Compute ActivityMetrics given events, a (minimum) TimeRange to filter them by, and an optional reference timepoint
// (defaulting to end of timeRange) for any metrics that are "up to time t" like the distance traveled 5 minutes
// in to a 20 minute run, for example, which wouldn't be needed to calculate totals like the total distance.
// "partials" are the metrics that depend on t, in contrast to totals.
export const activityMetrics = (events: GenericEvents,
  timeRange: TimeRange,
  t: Timepoint = timeRange[1]): ActivityMetrics => {

  const filterRange = [timeRange[0], Math.max(timeRange[1], t)] as TimeRange; // expand timeRange to cover t if needed
  const activityEvents = timeseries.filterByTime(events, filterRange);

  // distance
  let firstOdo = 0, lastOdo = 0;
  let distanceMetric: Optional<ActivityMetric> = {
    label: 'Distance (miles)',
  }

  // elevation
  let elevationPrevious, elevation, elevationMetric: ActivityMetric = { label: 'Elevation (feet)' };
  let modeMetric: ActivityMetric = {
    label: 'Mode',
    text: ' ',
  }
  let elevationGain = 0;
  const elevationGainMetric: Optional<ActivityMetric> = {
    label: 'Elevation gain (feet)',
  }
  let elevationLoss = 0;
  const elevationLossMetric: Optional<ActivityMetric> = {
    label: 'Elevation loss (feet)',
  }
  let maxElevation: number, minElevation: number;

  // speed
  let lastSpeed = 0, speedMetric: Optional<ActivityMetric> = {
    label: 'Speed (mph)',
  }

  // Metrics that do not require iterating through events:

  // Event count
  const eventCountMetric: ActivityMetric = {
    label: '# of events',
    text: activityEvents.length.toString(),
    totalValue: activityEvents.length,
  }

  // Time
  const totalTimeValue = Math.max(0, timeRange[1] - timeRange[0]);
  const partialTimeValue = t ? Math.max(0, t - timeRange[0]) : totalTimeValue;
  const partialTimeDisplayText = (partialTimeValue === totalTimeValue) ?
    `${msecToString(partialTimeValue)}` :
    `${msecToString(partialTimeValue)}/${msecToString(totalTimeValue)}`;
  const timeMetric: ActivityMetric = {
    label: 'Elapsed time',
    text: partialTimeDisplayText,
    partialValue: partialTimeValue,
    totalValue: totalTimeValue,
  }

  // TODO this will do odd things if events are out of time order. Verify they are not. Maybe add a data quality metric?
  try {
    let partialEventCount = 0;
    for (let i = 0; i < activityEvents.length; i++) {
      const event = activityEvents[i];
      if (event.t <= t) { // for calculating "up to time t"
        // event count
        partialEventCount++;
        eventCountMetric.partialValue = partialEventCount;
        eventCountMetric.text = (partialEventCount === activityEvents.length) ?
          activityEvents.length.toString() : `${partialEventCount}/${activityEvents.length}`;

        if (event.type === EventType.MODE) {
          const modeChangeEvent = event as ModeChangeEvent;
          const { mode } = modeChangeEvent.data;
          switch (mode) {
            case ModeType.BICYCLE:
              modeMetric.text = 'Bicycling'
              break;
            case ModeType.ON_FOOT:
              modeMetric.text = 'Walking';
              break;
            case ModeType.STILL:
              modeMetric.text = 'Still';
              break;
            case ModeType.RUNNING:
              modeMetric.text = 'Running';
              break;
            case ModeType.VEHICLE:
              modeMetric.text = 'Driving';
              break;
            default:
              break;
          }
        // Special case: STILL mode change implies speed should now be zero, regardless of the last report from the GPS.
          if (mode === ModeType.STILL) {
            speedMetric.text = '0'; // hard-coded zero
          }
        }
        if (event.type === EventType.LOC) {
          const locationEvent = event as LocationEvent;
          if (locationEvent.t + sharedConstants.metrics.speed.maxAgeCurrent >= t) {
            if (locationEvent.data.speed && locationEvent.data.speed >= 0) {
              lastSpeed = locationEvent.data.speed;
              const lastSpeedText = lastSpeed.toFixed(1); // 0.1 mph is probably more than sufficient accuracy
              speedMetric.text = lastSpeedText;
              speedMetric.partialValue = lastSpeed;
            }
            if (locationEvent.data.ele) {
              elevation = locationEvent.data.ele;
              if (elevationPrevious) {
                const difference = elevation - elevationPrevious;
                if (difference > 0) {
                  elevationGain += difference;
                } else {
                  elevationLoss -= difference;
                }
              }
              // note elevationPrevious is set below
            }
          }
        }
      }
      // General case of any location event
      if (event.type === EventType.LOC) {
        const locationEvent = event as LocationEvent;
        // elevation
        if (locationEvent.data.ele || locationEvent.data.ele === 0) {
          const latestElevation = locationEvent.data.ele;
          if (!maxElevation || latestElevation >= maxElevation) {
            maxElevation = latestElevation;
          }
          if (!minElevation || latestElevation <= minElevation) {
            minElevation = latestElevation;
          }
          if (elevationPrevious) {
            const difference = latestElevation - elevationPrevious;
            if (difference > 0) {
              elevationGain += difference;
            } else {
              elevationLoss -= difference;
            }
          }
          elevationPrevious = latestElevation;
        }
        // distance
        if (locationEvent.data.odo) {
          if (!firstOdo) {
            firstOdo = locationEvent.data.odo;
          }
          lastOdo = locationEvent.data.odo;
          if (locationEvent.t <= t) {
            distanceMetric.label = 'Miles / Total',
            distanceMetric.partialValue = metersToMiles(lastOdo - firstOdo);
          }
        }
      }
    }
    // Finalize the elevation metric
    if (elevation || elevation === 0) {
      elevationMetric.partialValue = Math.round(metersToFeet(elevation));
    }
    if (maxElevation || maxElevation === 0) {
      elevationMetric.max = Math.round(metersToFeet(maxElevation));
    }
    if (minElevation || minElevation === 0) {
      elevationMetric.min = Math.round(metersToFeet(minElevation));
    }
    if (elevationGain) {
      elevationGainMetric.totalValue = Math.round(metersToFeet(elevationGain));
    }
    if (elevationLoss) {
      // label: 'Total descent (feet)',
      elevationLossMetric.totalValue = Math.round(metersToFeet(elevationLoss));
    }
    if (elevationGain) {
      // label: 'Total ascent (feet)',
      elevationGainMetric.totalValue = Math.round(metersToFeet(elevationGain));
    }
    const totalDistanceMiles = metersToMiles(lastOdo - firstOdo);
    const totalDistanceMilesText = totalDistanceMiles.toFixed(2);
    distanceMetric.text = `${totalDistanceMilesText}`;
    if (distanceMetric.partialValue) {
      const partialDistanceMilesText = distanceMetric.partialValue.toFixed(2);
      distanceMetric.text = `${partialDistanceMilesText}/${totalDistanceMilesText}`;
      if (partialDistanceMilesText !== totalDistanceMilesText) {
        distanceMetric.text = `${partialDistanceMilesText}/${totalDistanceMilesText}`;
      }
    }
  } catch (err) {
    log.error('activityMetrics error', err);
  } finally {
    return new Map<ActivityMetricName, Optional<ActivityMetric>>([
      [ActivityMetricName.distance, distanceMetric],
      [ActivityMetricName.elevation, elevationMetric],
      [ActivityMetricName.eventCount, eventCountMetric],
      [ActivityMetricName.mode, modeMetric],
      [ActivityMetricName.speed, speedMetric],
      [ActivityMetricName.elevationGain, elevationGainMetric],
      [ActivityMetricName.elevationLoss, elevationLossMetric],
      [ActivityMetricName.time, timeMetric],
    ])
  }
}
