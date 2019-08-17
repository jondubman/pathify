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
  'averagePace' = 'averagePace',
  'averageSpeed' = 'averageSpeed',
  'elevation' = 'elevation',
  'eventCount' = 'eventCount',
  'maxElevation' = 'maxElevation',
  'maxSpeed' = 'maxSpeed',
  'minElevation' = 'minElevation',
  'minPace' = 'minPace',
  'mode' = 'mode',
  'movingTime' = 'movingTime',
  'pace' = 'pace',
  'paceLastTenSeconds' = 'paceLastTenSeconds',
  'paceLastMinute' = 'paceLastMinute',
  'paceLastMile' = 'paceLastMile',
  'partialDistance' = 'partialDistance',
  'partialElevationGain' = 'partialElevationGain',
  'partialElevationLoss' = 'partialElevationLoss',
  'partialTime' = 'partialTime',
  'stoppedTime' = 'stoppedTime',
  'speed' = 'speed',
  'totalDistance' = 'totalDistance',
  'totalElevationGain' = 'totalElevationGain',
  'totalElevationLoss' = 'totalElevationLoss',
  'totalTime' = 'totalTime',
}

export type ActivityMetric = { // example:
  label?: string;              // 'mi'
  text?: string;               // '4.5'
  value?: number;               // 4.5
}

type Optional<T> = T | null;
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
  let partialDistanceMetric: Optional<ActivityMetric> = null;
  let totalDistanceMetric: Optional<ActivityMetric> = null;

  // elevation
  let elevationPrevious, elevation, elevationMetric: ActivityMetric = { label: 'Elevation (feet)' };
  let maxElevation, maxElevationMetric: Optional<ActivityMetric> = null;
  let minElevation, minElevationMetric: Optional<ActivityMetric> = null;
  let modeMetric: ActivityMetric = {
    label: 'Mode',
    text: ' ',
  }
  let partialElevationGain = 0, partialElevationGainMetric: Optional<ActivityMetric> = null;
  let partialElevationLoss = 0, partialElevationLossMetric: Optional<ActivityMetric> = null;
  let totalElevationGain = 0, totalElevationGainMetric: Optional<ActivityMetric> = null;
  let totalElevationLoss = 0, totalElevationLossMetric: Optional<ActivityMetric> = null;

  // speed
  let lastSpeed = 0, speedMetric: Optional<ActivityMetric> = null;
  const speedLabel = 'Speed (mph)';

  // Time (don't need to look at events for this)
  const totalTimeValue = Math.max(0, timeRange[1] - timeRange[0]);
  const totalTimeMetric: ActivityMetric = {
    label: 'Total time',
    value: totalTimeValue,
  }
  const partialTimeValue = t ? Math.max(0, t - timeRange[0]) : totalTimeValue;
  const partialTimeDisplayText = (partialTimeValue === totalTimeValue) ?
    `${msecToString(partialTimeValue)}` :
    `${msecToString(partialTimeValue)}/${msecToString(totalTimeValue)}`;
  const partialTimeMetric: ActivityMetric = {
    label: 'Elapsed Time',
    text: partialTimeDisplayText,
    value: partialTimeValue,
  }

  // TODO this will do odd things if events are out of time order. Verify they are not. Maybe add a data quality metric?
  try {
    for (let i = 0; i < activityEvents.length; i++) {
      const event = activityEvents[i];
      if (event.t <= t) { // for calculating "up to time t"
        // Speed
        // Special case: STILL mode change implies speed should now be zero, regardless of the last report from the GPS.
        if (event.type === EventType.MODE) {
          const modeChangeEvent = event as ModeChangeEvent;
          const { mode } = modeChangeEvent.data;
          switch (mode) {
            case ModeType.BICYCLE:
              modeMetric.text = 'bicycling'
              break;
            case ModeType.ON_FOOT:
              modeMetric.text = 'walking';
              break;
            case ModeType.STILL:
              modeMetric.text = 'still';
              break;
            case ModeType.RUNNING:
              modeMetric.text = 'running';
              break;
            case ModeType.VEHICLE:
              modeMetric.text = 'in vehicle';
              break;
            default:
              break;
          }
          if (mode === ModeType.STILL) {
            speedMetric = {
              text: '0',
              label: speedLabel,
            }
          }
        }
        if (event.type === EventType.LOC) {
          const locationEvent = event as LocationEvent;
          if (locationEvent.t + sharedConstants.metrics.speed.maxAgeCurrent >= t) {
            if (locationEvent.data.speed && locationEvent.data.speed >= 0) {
              lastSpeed = locationEvent.data.speed;
              const lastSpeedText = lastSpeed.toFixed(1); // 0.1 mph is probably more than sufficient accuracy
              speedMetric = {
                text: lastSpeedText,
                label: speedLabel,
                value: lastSpeed,
              }
            }
            if (locationEvent.data.ele) {
              elevation = locationEvent.data.ele;
              if (elevationPrevious) {
                const difference = elevation - elevationPrevious;
                if (difference > 0) {
                  partialElevationGain += difference; // this will add to partialElevationGain
                } else {
                  partialElevationLoss -= difference; // this will add to partialElevationLoss
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
              totalElevationGain += difference; // this will add to partialElevationGain
            } else {
              totalElevationLoss -= difference; // this will add to partialElevationLoss
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
            partialDistanceMetric = {
              label: 'miles / total',
              value: metersToMiles(lastOdo - firstOdo),
            }
          }
        }
      }
    }
    // Finalize the elevation metrics
    if (elevation || elevation === 0) {
      elevationMetric.value = Math.round(metersToFeet(elevation));
    }
    if (maxElevation || maxElevation === 0) {
      maxElevationMetric = {
        label: 'Max elevation (feet)',
        value: Math.round(metersToFeet(maxElevation)),
      }
    }
    if (minElevation || minElevation === 0) {
      minElevationMetric = {
        label: 'Min elevation (feet)',
        value: Math.round(metersToFeet(minElevation)),
      }
    }
    if (partialElevationGain) {
      partialElevationGainMetric = {
        label: 'Elevation gain (feet)',
        value: Math.round(metersToFeet(partialElevationGain)),
      }
    }
    if (partialElevationLoss) {
      partialElevationLossMetric = {
        label: 'Elevation loss (feet)',
        value: Math.round(metersToFeet(partialElevationLoss)),
      }
    }
    if (totalElevationGain) {
      totalElevationGainMetric = {
        label: 'Total ascent (feet)',
        value: Math.round(metersToFeet(partialElevationGain)),
      }
    }
    if (totalElevationLoss) {
      totalElevationLossMetric = {
        label: 'Total descent (feet)',
        value: Math.round(metersToFeet(partialElevationLoss)),
      }
    }
    // Set totalDistance
    const totalDistanceMiles = metersToMiles(lastOdo - firstOdo);
    const totalDistanceMilesText = totalDistanceMiles.toFixed(2);
    totalDistanceMetric = {
      label: 'Distance (miles)',
      text: totalDistanceMilesText,
      value: totalDistanceMiles,
    }
    // Finalize partialDistance
    if (partialDistanceMetric) {
      const partialDistanceText = partialDistanceMetric.value!.toFixed(2);
      partialDistanceMetric.text = partialDistanceText;
      if (partialDistanceText === totalDistanceMilesText) {
        partialDistanceMetric.text = totalDistanceMetric.text;
      } else {
        partialDistanceMetric.text = `${partialDistanceText}/${totalDistanceMilesText}`;
      }
    } else {
      partialDistanceMetric = totalDistanceMetric;
    }
  } catch (err) {
    log.error('activityMetrics error', err);
  } finally {
    return new Map<ActivityMetricName, Optional<ActivityMetric>>([
      [ActivityMetricName.elevation, elevationMetric],
      [ActivityMetricName.eventCount, { value: activityEvents.length }],
      [ActivityMetricName.maxElevation, maxElevationMetric],
      [ActivityMetricName.minElevation, minElevationMetric],
      [ActivityMetricName.mode, modeMetric],
      [ActivityMetricName.partialDistance, partialDistanceMetric],
      [ActivityMetricName.partialElevationGain, partialElevationGainMetric],
      [ActivityMetricName.partialElevationLoss, partialElevationLossMetric],
      [ActivityMetricName.partialTime, partialTimeMetric],
      [ActivityMetricName.speed, speedMetric],
      [ActivityMetricName.totalDistance, totalDistanceMetric],
      [ActivityMetricName.totalElevationGain, totalElevationGainMetric],
      [ActivityMetricName.totalElevationLoss, totalElevationLossMetric],
      [ActivityMetricName.totalTime, totalTimeMetric],
    ])
  }
}
