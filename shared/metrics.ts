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
  displayText?: string;        // '4.5 mi'
  text?: string;               // '4.5'
  units?: string;              // 'mi'
  value: number;               // 4.5
}

export type ActivityMetrics = Map<ActivityMetricName, ActivityMetric>;

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
  let partialDistance: ActivityMetric | undefined;
  let totalDistance: ActivityMetric | undefined;

  // elevation
  let maxElevation, maxElevationMetric: ActivityMetric = null;
  let minElevation, minElevationMetric: ActivityMetric = null;
  let elevationPrevious, elevation, elevationMetric: ActivityMetric = null;
  let partialElevationGain = 0, partialElevationGainMetric: ActivityMetric = null;
  let partialElevationLoss = 0, partialElevationLossMetric: ActivityMetric = null;
  let totalElevationGain = 0, totalElevationGainMetric: ActivityMetric = null;
  let totalElevationLoss = 0, totalElevationLossMetric: ActivityMetric = null;

  // speed
  let lastSpeed = 0, speedMetric: ActivityMetric = null;
  const speedUnits = 'Speed (mph)';

  // Time (don't need to look at events for this)
  const totalTimeValue = Math.max(0, timeRange[1] - timeRange[0]);
  const partialTimeValue = t ? Math.max(0, t - timeRange[0]) : totalTimeValue;
  const partialTimeDisplayText = (partialTimeValue === totalTimeValue) ?
    `${msecToString(partialTimeValue)}` :
    `${msecToString(partialTimeValue)}/${msecToString(totalTimeValue)}`;
  const partialTime = {
    displayText: partialTimeDisplayText,
    units: 'Elapsed Time',
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
          if (modeChangeEvent.data.mode === ModeType.STILL) {
            speedMetric = {
              text: '0',
              units: speedUnits,
              value: 0,
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
                units: speedUnits,
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
          elevation = locationEvent.data.ele;
          if (!maxElevation || elevation >= maxElevation) {
            maxElevation = elevation;
          }
          if (!minElevation || elevation <= minElevation) {
            minElevation = elevation;
          }
          if (elevationPrevious) {
            const difference = elevation - elevationPrevious;
            if (difference > 0) {
              totalElevationGain += difference; // this will add to partialElevationGain
            } else {
              totalElevationLoss -= difference; // this will add to partialElevationLoss
            }
          }
          elevationPrevious = elevation;
        }
        // distance
        if (locationEvent.data.odo) {
          if (!firstOdo) {
            firstOdo = locationEvent.data.odo;
          }
          lastOdo = locationEvent.data.odo;
          if (locationEvent.t <= t) {
            partialDistance = {
              units: 'miles / total',
              value: metersToMiles(lastOdo - firstOdo),
            }
          }
        }
      }
    }
    // Finalize the elevation metrics
    if (elevation || elevation === 0) {
      elevationMetric = {
        units: 'Elevation (feet)',
        value: Math.round(metersToFeet(elevation)),
      }
    }
    if (maxElevation || maxElevation === 0) {
      maxElevationMetric = {
        units: 'Max elevation (feet)',
        value: Math.round(metersToFeet(maxElevation)),
      }
    }
    if (minElevation || minElevation === 0) {
      minElevationMetric = {
        units: 'Min elevation (feet)',
        value: Math.round(metersToFeet(minElevation)),
      }
    }
    if (partialElevationGain) {
      partialElevationGainMetric = {
        units: 'Elevation gain (feet)',
        value: Math.round(metersToFeet(partialElevationGain)),
      }
    }
    if (partialElevationLoss) {
      partialElevationLossMetric = {
        units: 'Elevation loss (feet)',
        value: Math.round(metersToFeet(partialElevationLoss)),
      }
    }
    if (totalElevationGain) {
      totalElevationGainMetric = {
        units: 'Total ascent (feet)',
        value: Math.round(metersToFeet(partialElevationGain)),
      }
    }
    if (totalElevationLoss) {
      totalElevationLossMetric = {
        units: 'Total descent (feet)',
        value: Math.round(metersToFeet(partialElevationLoss)),
      }
    }
    // Set totalDistance
    const totalDistanceMiles = metersToMiles(lastOdo - firstOdo);
    const totalDistanceMilesText = totalDistanceMiles.toFixed(2);
    totalDistance = {
      displayText: totalDistanceMilesText,
      text: totalDistanceMilesText,
      units: 'Distance (miles)',
      value: totalDistanceMiles,
    }
    // Finalize partialDistance
    if (partialDistance) {
      const partialDistanceText = partialDistance.value.toFixed(2);
      partialDistance.text = partialDistanceText;
      if (partialDistanceText === totalDistanceMilesText) {
        partialDistance.displayText = totalDistance.displayText;
      } else {
        partialDistance.displayText = `${partialDistanceText}/${totalDistanceMilesText}`;
      }
    }
  } catch (err) {
    log.error('activityMetrics error', err);
  } finally {
    return new Map<ActivityMetricName, ActivityMetric>([
      [ActivityMetricName.elevation, elevationMetric],
      [ActivityMetricName.eventCount, { value: activityEvents.length }],
      [ActivityMetricName.partialDistance, partialDistance ? partialDistance : totalDistance],
      [ActivityMetricName.partialElevationGain, partialElevationGainMetric],
      [ActivityMetricName.partialElevationLoss, partialElevationLossMetric],
      [ActivityMetricName.partialTime, partialTime],
      [ActivityMetricName.speed, speedMetric],
      [ActivityMetricName.totalDistance, totalDistance ? totalDistance : null],
      [ActivityMetricName.totalElevationGain, totalElevationGainMetric],
      [ActivityMetricName.totalElevationLoss, totalElevationLossMetric],
      [ActivityMetricName.totalTime, {
        units: 'Total time',
        value: totalTimeValue,
      }],
    ])
  }
}
