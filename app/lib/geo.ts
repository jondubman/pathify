// Geo: Configuration and support code related to react-native-background-geolocation.
// Includes LocationEvent interface.

import * as turf from '@turf/helpers';
import distance from '@turf/distance';

import BackgroundGeolocation, {
  // State,
  Config,
  Location,
  LocationError,
  // Geofence,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  // HttpEvent,
  MotionActivityEvent,
  MotionChangeEvent,
  // ProviderChangeEvent,
  // ConnectivityChangeEvent
} from 'react-native-background-geolocation';

import { AppAction, GeolocationParams, newAction } from 'lib/actions';
import constants from 'lib/constants';
import { currentActivityId } from 'lib/selectors';
import { Store } from 'lib/store';
import utils from 'lib/utils';
import locations, {
  LocationEvent,
  LocationEvents,
  ModeChangeEvent,
  ModeType,
  MotionEvent
} from 'shared/locations';
import log from 'shared/log';
import timeseries, { EventType } from 'shared/timeseries';
import { metersPerSecondToMilesPerHour } from 'shared/units';

const geolocationOptions: Config = {
  // --------------
  // Common Options
  // --------------
  // Specify the desired-accuracy of the geolocation system with 1 of 4 values, 0, 10, 100, 1000 where
  // 0 means HIGHEST POWER, HIGHEST ACCURACY and 1000 means LOWEST POWER, LOWEST ACCURACY
  // desiredAccuracy: 0,
  // distanceFilter: 10, // meters device must move to generate update event, default 10

  // set true to disable automatic speed-based #distanceFilter elasticity
  // (device moving at highway speeds -> locations returned at ~1/km)
  disableElasticity: true, // default false
  stopAfterElapsedMinutes: 0, // default 0

  // stopOnStationary: false, // default false

  // ----------------------------
  // Activity Recognition Options
  // ----------------------------

  // desired time between activity detections.
  // Larger values will result in fewer activity detections while improving battery life.
  // A value of 0 will result in activity detections at the fastest possible rate.
  // activityRecognitionInterval: 1000, // msec

  // number of minutes to wait before turning off location-services after the
  // ActivityRecognition System (ARS) detects the device is STILL.
  // stopTimeout: 3, // minutes

  // desired % confidence to trigger an activity state-change
  minimumActivityRecognitionConfidence: 32,

  // defaults to 0. Delays stop-detection system, in which location-services is turned off and only the accelerometer is monitored.
  // Stop-detection will only engage if this timer expires. The timer is cancelled if any movement is detected before expiration.
  // If 0, stop-detection system engages when device is stationary.
  // stopDetectionDelay: 1, // minutes

  // Location accuracy threshold in meters for odometer calculations. Default 100m.
  // desiredOdometerAccuracy: 10,

  // -------------------
  // Application Options
  // -------------------
  stopOnTerminate: true, // set false to continue tracking after user terminates the app
  startOnBoot: true, // set to true to enable background-tracking after the device reboots
  // heartbeatInterval: 60, // rate in seconds to fire heartbeat events (default 60)

  // ------------------
  // Geofencing Options
  // ------------------
  // https://github.com/transistorsoft/react-native-background-geolocation/blob/master/docs/geofencing.md

  // Radius to query for geofences within proximity. Default 1000m.
  // When using Geofences, the plugin activates only those in proximity.
  // Only 20 geofences can be simultaneously monitored on iOS, and 100 on Android.
  // Plugin allows arbitrary # of geofences (thousands even). Plugin stores in its database
  // database and uses spatial queries to determine which 20 or 100 geofences to activate.
  geofenceProximityRadius: 1000, // meters

  // Set false to disable triggering a geofence immediately if device is already inside it.
  geofenceInitialTriggerEntry: true, // default true

  // -----------------------
  // Logging & Debug options
  // -----------------------

  // https://github.com/transistorsoft/react-native-background-geolocation/wiki/Debug-Sounds
  debug: false, // default false
  // iOS NOTE: In addition, you must manually enable the Audio and Airplay background mode
  // in Background Capabilities to hear these debugging sounds

  // ----------------
  // iOS-only options
  // ----------------

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  // stationaryRadius: 1,

  useSignificantChangesOnly: false, // default false
  locationAuthorizationRequest: 'Always', // either Always or WhenInUse
  // locationAuthorizationAlert: {}, // default {}

  // Enable to prevent iOS from suspending when stationary. Must be used with a heartbeatInterval.
  // preventSuspend: false, // default false

  // https://developer.apple.com/documentation/corelocation/cllocationmanager/1620567-activitytype
  // default 'Other'
  activityType: BackgroundGeolocation.ACTIVITY_TYPE_OTHER,

  // Note plugin is highly optimized for motion-activity-updates. Disabling these is not advised.
  disableMotionActivityUpdates: false, // default false

  // Configure the initial tracking- state after BackgroundGeolocation.start is called.
  // The plugin will immediately enter the tracking-state, bypassing the stationary state.
  // If the device is not currently moving, the stop detection system will still engage.
  // After stopTimeout minutes without movement, the plugin will enter the stationary state, as usual.
  isMoving: true,

  // Optionally, you can specify reset: true to #ready. This will esentially force the supplied {config} to be
  // applied with each launch of your application, making it behave like the traditional #configure method.
  // https://github.com/transistorsoft/react-native-background-geolocation/blob/master/docs/README.md#resetconfig-successfn-failurefn
  // https://transistorsoft.github.io/react-native-background-geolocation/classes/_react_native_background_geolocation_.backgroundgeolocation.html#ready
  reset: false, // TODO
}

// stopDetectionDelay is the time between when motion is still and accelerometer is monitored with GPS off.

const geolocationOptions_lowPower: Config = {
  ...geolocationOptions,

  // desired time between activity detections.
  // Larger values will result in fewer activity detections while improving battery life.
  // A value of 0 will result in activity detections at the fastest possible rate.
  activityRecognitionInterval: 10000, // msec

  // Specify the desired-accuracy of the geolocation system with 1 of 4 values, 0, 10, 100, 1000 where
  // 0 means HIGHEST POWER, HIGHEST ACCURACY and 1000 means LOWEST POWER, LOWEST ACCURACY
  desiredAccuracy: 10, // 0 is highest

  desiredOdometerAccuracy: 10, // Location accuracy threshold in meters for odometer calculations.

  distanceFilter: 10, // meters device must move to generate update event, default 10
  heartbeatInterval: 10, // rate in seconds to fire heartbeat events (default 60)
  preventSuspend: false, // default false TODO

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 10, // meters

  stopDetectionDelay: 1, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  stopOnStationary: false, // default false
  stopTimeout: 3, // Minutes to wait in moving state with no movement before considering the device stationary
}

const geolocationOptions_highPower: Config = {
  ...geolocationOptions,

  // desired time between activity detections.
  // Larger values will result in fewer activity detections while improving battery life.
  // A value of 0 will result in activity detections at the fastest possible rate.
  activityRecognitionInterval: 1000, // msec

  // Specify the desired-accuracy of the geolocation system with 1 of 4 values, 0, 10, 100, 1000 where
  // 0 means HIGHEST POWER, HIGHEST ACCURACY and 1000 means LOWEST POWER, LOWEST ACCURACY
  desiredAccuracy: 0, // 0 is highest
  desiredOdometerAccuracy: 10, // Location accuracy threshold in meters for odometer calculations.

  distanceFilter: 1, // meters device must move to generate update event, default 10
  heartbeatInterval: 10, // rate in seconds to fire heartbeat events (default 60)
  preventSuspend: true, // default false (note true has major battery impact!)
  forceReloadOnBoot: true, // TODO
  startOnBoot: true, // set to true to enable background-tracking after the device reboots

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 1, // meters

  stopDetectionDelay: 5, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  stopOnStationary: false, // default false
  stopOnTerminate: false,
  stopTimeout: 5, // Minutes to wait in moving state with no movement before considering the device stationary
}

const geolocationOptions_default: Config = geolocationOptions_lowPower; // TODO

// TODO geolocationOptions_maxPower

const reasons = {}; // to enable backgroundGeolocation (see startBackgroundGeolocation)
const haveReason = () => Object.values(reasons).includes(true); // do we have a reason for backgroundGeolocation?
// const haveReasonBesides = (reason: string) => Object.values(utils.objectWithoutKey(reasons, reason)).includes(true);

const newLocationEvent = (info: Location, activityId: string | undefined): LocationEvent => {
  const t = new Date(info.timestamp).getTime();
  return {
    ...timeseries.newSyncedEvent(t),
    activityId,
    type: EventType.LOC,
    accuracy: info.coords.accuracy,
    battery: info.battery.level,
    charging: info.battery.is_charging,
    ele: info.coords.altitude,
    heading: info.coords.heading,
    lat: info.coords.latitude,
    lon: info.coords.longitude,
    odo: info.odometer,
    speed: (info.coords.speed && info.coords.speed >= 0) ? metersPerSecondToMilesPerHour(info.coords.speed!)
        : undefined,
  }
}

const newMotionEvent = (info: Location, isMoving: boolean, activityId: string | undefined): MotionEvent => {
  const t = new Date(info.timestamp).getTime();
  return {
    ...timeseries.newSyncedEvent(t),
    activityId,
    type: EventType.MOTION,
    isMoving,
  }
}

const newModeChangeEvent = (activity: string, confidence: number, activityId: string | undefined): ModeChangeEvent => {
  const t = utils.now(); // TODO
  const mapActivityToMode = {
      in_vehicle: ModeType.VEHICLE,
      on_bicycle: ModeType.BICYCLE,
      on_foot: ModeType.ON_FOOT,
      running: ModeType.RUNNING,
      still: ModeType.STILL,
    }
  const mode = mapActivityToMode[activity] || `unknown activity: ${activity}`;
  log.trace('newModeChangeEvent', activity, mode);
  return {
    ...timeseries.newSyncedEvent(t),
    activityId,
    type: EventType.MODE,
    mode,
    confidence,
  }
}

export const Geo = {

  initializeGeolocation: (store: Store) => {
    log.debug('initializeGeolocation');

    // Now, configure the plugin, using those options.
    BackgroundGeolocation.ready(geolocationOptions_default, pluginState => {

      const onActivityChange = (event: MotionActivityEvent) => {
        const state = store.getState();
        const activityId = currentActivityId(state);
        store.dispatch(newAction(AppAction.modeChange,
                       newModeChangeEvent(event.activity, event.confidence, activityId)));
      }
      const onEnabledChange = (isEnabled: boolean) => {
      }
      const onGeofence = (event: GeofenceEvent) => {
      }
      const onGeofencesChange = (event: GeofencesChangeEvent) => {
      }
      const onHeartbeat = (event: HeartbeatEvent) => {
        // Executed for each heartbeatInterval while the device is in stationary state
        // (iOS requires preventSuspend: true as well).
      }
      const onLocation = (location: Location) => {
        const state = store.getState();
        const activityId = currentActivityId(state);

        // const { userLocation } = state;
        // if (!userLocation /* && locationEvent.accuracy, sample TODO */) {
        //   // This is the first userLocation to arrive.
        //   store.dispatch(newAction(AppAction.centerMap, {
        //     center: locations.lonLat(locationEvent),
        //     option: 'absolute',
        //   }))
        // }

        if (location.sample) {
          return;
        }
        const saveLocation = async (location: Location) => {
          log.debug('saveLocation', location.timestamp);
          if (!state.flags.receiveLocations) {
            return;
          }
          const locationEvent = newLocationEvent(location, activityId);
          store.dispatch(newAction(AppAction.addEvents, { events: [locationEvent] }));

          const geolocationParams: GeolocationParams = {
            locationEvents: [locationEvent],
            recheckMapBounds: true,
          }
          store.dispatch(newAction(AppAction.geolocation, geolocationParams));
        }

        BackgroundGeolocation.startBackgroundTask().then(async (taskId) => {
          saveLocation(location).then(() => {
            // When long-running task is complete, signal completion of taskId.
            BackgroundGeolocation.stopBackgroundTask(taskId);
          }).catch(() => {
            BackgroundGeolocation.stopBackgroundTask(taskId);
          })
        })

        // // Events are 'old' if they are timestamped as little as like five seconds ago. The app may have run for a while
        // // in the background, collecting data into the plugin's local SQLite DB that we are receiving only now.
        // const eventIsOld = locationEvent.t < utils.now() - constants.geolocationAgeThreshold;
        // let eventIsFar = false;
        // if (userLocation) {
        //   const dist = distance(turf.point([locationEvent.lon, locationEvent.lat]),
        //                         turf.point([userLocation.lon, userLocation.lat]),
        //                         { units: 'meters' });
        //   eventIsFar = dist > 100; // TODO constant (meters)
        // }
        // const extraLabel = eventIsFar ? '(far)' : (eventIsOld ? '(old)' : '(new)');
        // locationEvent.extra = `onLocation ${utils.now()} ${extraLabel}`; // TODO only for debugging
        // // Important: Do not blindly addEvents immediately or JS thread gets overwhelmed and frame rate plummets.
        // // Instead, queue up old or distant events and add them as a batch.
        // if (eventIsFar || eventIsOld) {
        //   eventQueue.push(locationEvent);
        // } else {
        //   let geolocationParams: GeolocationParams;
        //   if (state.flags.receiveLocations) {
        //     store.dispatch(newAction(AppAction.addEvents, { events: [...eventQueue, locationEvent] }));
        //     if (eventQueue.length) {
        //       eventQueue = []; // reset
        //     }
        //   }
        //   // Handle only the latest geolocation, with exactly one map bounds check, now that everything is added.
        //   geolocationParams = {
        //     locationEvents: [locationEvent],
        //     recheckMapBounds: true,
        //   }
        //   store.dispatch(newAction(AppAction.geolocation, geolocationParams));
        // }
      }
      const onLocationError = (error: LocationError) => {
        let errorMessage;
        if (error === 0) errorMessage = 'Location unknown';
        if (error === 1) errorMessage = 'Location permission denied';
        if (error === 2) errorMessage = 'Location network error';
        if (error === 408) errorMessage = 'Location timeout';
        log.warn('LocationError', errorMessage || error);
      }
      const onMotionChange = (event: MotionChangeEvent) => {
        const state = store.getState();
        const activityId = currentActivityId(state);
        store.dispatch(newAction(AppAction.motionChange, newMotionEvent(event.location, event.isMoving, activityId)));
      }
      BackgroundGeolocation.onActivityChange(onActivityChange);
      BackgroundGeolocation.onEnabledChange(onEnabledChange);
      BackgroundGeolocation.onGeofence(onGeofence);
      BackgroundGeolocation.onGeofencesChange(onGeofencesChange);
      BackgroundGeolocation.onHeartbeat(onHeartbeat);
      BackgroundGeolocation.onLocation(onLocation, onLocationError);
      BackgroundGeolocation.onMotionChange(onMotionChange);

      if (pluginState.enabled) {
        log.trace('BackgroundGeolocation configured and ready', pluginState);
      }
      BackgroundGeolocation.getCurrentPosition({}, onLocation); // fetch an initial location
    }, err => {
      log.error('BackgroundGeolocation failed to configure', err);
    })
  },

  changePace: (isMoving: boolean, done: Function) => {
    BackgroundGeolocation.changePace(isMoving, done);
  },

  enableBackgroundGeolocation: async (enable: boolean) => {
    log.debug('enableBackgroundGeolocation', enable);
    if (enable) {
      await Geo.startBackgroundGeolocation('tracking');
      BackgroundGeolocation.setConfig(geolocationOptions_highPower);
      log.debug('using geolocationOptions_highPower');
    } else {
      await Geo.stopBackgroundGeolocation('tracking');
      BackgroundGeolocation.setConfig(geolocationOptions_lowPower);
      log.debug('using geolocationOptions_lowPower');
    }
  },

  // Event handlers for background geolocation
  // https://github.com/transistorsoft/react-native-background-geolocation/wiki/Location-Data-Schema
  // info: {
  //   "timestamp":     [Date],     // <-- Javascript Date instance
  //   "event":         [String],   // <-- motionchange|geofence|heartbeat
  //   "is_moving":     [Boolean],  // <-- The motion-state when location was recorded.
  //   "is_heartbeat"   [Boolean],  // <-- If this location was recorded during heartbeat-mode
  //   "uuid":          [String],   // <-- Universally unique identifier
  //   "coords": {
  //       "latitude":  [Float],
  //       "longitude": [Float],
  //       "accuracy":  [Float],
  //       "speed":     [Float],
  //       "heading":   [Float],
  //       "altitude":  [Float]
  //   },
  //   "activity": {
  //       "type": [still|on_foot|running|in_vehicle|on_bicycle],
  //       "confidence": [0-100%]
  //   },
  //   "battery": {
  //       "level": [Float],
  //       "is_charging": [Boolean]
  //   },
  //   "odometer": [Float/meters]
  // }

  resetOdometer: async () => {
    const done = () => {
      log.debug('resetOdometer done');
    }
    BackgroundGeolocation.resetOdometer(done, () => { log.info('reset odometer') });
  },

  // Geolocation may be needed for multiple reasons.
  // Client who starts geolocation should specify a reason string, e.g. 'tracking' or 'navigating'.
  // Client should then pass the same reason when requesting to stopBackgroundGeolocation.
  // If any reasons still apply on stopBackgroundGeolocation, we leave geolocation on.
  // Resolves to true if background geolocation was started as a result of this request.
  startBackgroundGeolocation: async (reason: string) => {
    log.debug(`startBackgroundGeolocation: reason: ${reason}`);
    if (reasons[reason]) {
      log.debug(`BackgroundGeolocation already active for ${reason} in startBackgroundGeolocation`);
      log.trace('BackgroundGeolocation reasons', reasons);
      return false;
    }
    reasons[reason] = true;
    // if (haveReasonBesides(reason)) {
    //   log.debug(`BackgroundGeolocation requested for ${reason}, already running`);
    //   log.trace('BackgroundGeolocation reasons', reasons);
    //   return false;
    // }
    return new Promise((resolve, reject) => {
      const started = () => {
        const receieveLocation = (location: Location) => {
          // if (reduxStore) {
          //   const state = reduxStore.getState();
          //   const { flags } = state;
          //   if (flags.flag1) { // TODO2
          //     if (flags.appActive === false) { // TODO does this code ever execute?
          //       log.trace('BackgroundGeolocation.watchPosition receieveLocation', location);
          //       const locationEvent = newLocationEvent(location, currentActivityId(state));
          //       locationEvent.extra = `watchPosition ${utils.now()}`; // TODO
          //       if (flags.flag2) {
          //         reduxStore.dispatch(newAction(AppAction.geolocation, {
          //           locationEvents: [locationEvent],
          //           recheckMapBounds: false,
          //         }))
          //       }
          //       if (flags.flag3) {
          //         reduxStore.dispatch(newAction(AppAction.addEvents, {
          //           events: [locationEvent],
          //         }))
          //       }
          //     }
          //   }
          // } else {
          //   log.error('BackgroundGeolocation.watchPosition receieveLocation missing reduxStore');
          // }
        }
        const options = {
          interval: constants.timing.watchPositionInterval,
          persist: true, // to native SQLite database (first stored by plugin, then provided to app and stored in Realm)
        }
        if (reason === 'tracking') { // TODO is everything here necessary?
          BackgroundGeolocation.watchPosition(receieveLocation, err => {
            log.error('BackgroundGeolocation.watchPosition', err);
            reject(err);
          }, options)
        }
        resolve(true);
      }
      BackgroundGeolocation.start(started, err => {
        log.error('BackgroundGeolocation.start', err);
        reject(err);
      })
    })
  },

  // Returns true if background geolocation was stopped as a result of this request.
  stopBackgroundGeolocation: async (reason: string) => {
    if (!reasons[reason]) {
      log.debug(`BackgroundGeolocation already inactive for ${reason} in stopBackgroundGeolocation`);
      log.trace('BackgroundGeolocation reasons', reasons);
      return false;
    }
    if (reason === 'tracking') { // TODO
      const success = () => {
        log.debug('BackgroundGeolocation.stopWatchPosition success');
      }
      BackgroundGeolocation.stopWatchPosition(success, err => {
        log.error('BackgroundGeolocation.stopWatchPosition', err);
      })
    }
    reasons[reason] = false;
    if (haveReason()) { // still
      log.debug(`BackgroundGeolocation no longer needed for ${reason}, but still running`);
      log.trace('BackgroundGeolocation reasons', reasons);
      return false;
    }
    return new Promise((resolve, reject) => {
      const done = () => {
        log.debug(`BackgroundGeolocation stopped, was running for ${reason}`);
        resolve(true);
      }
      BackgroundGeolocation.stop(done, err => { reject(err); });
    })
  },
}

// On heading vs course:
// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/LocationAwarenessPG/GettingHeadings/GettingHeadings.html
// Devices with a magnetometer can report the direction in which a device is pointing (aka heading).
// Devices with GPS hardware can report the direction in which a device is moving (aka course).
