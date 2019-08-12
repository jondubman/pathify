// Geo: Configuration and support code related to react-native-background-geolocation.
// Includes LocationEvent interface.

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
import { Store } from 'lib/store';
import utils from 'lib/utils';
import {
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
  minimumActivityRecognitionConfidence: 65,

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

  // Optionally, you can specify reset: true to #ready. This will esentially force the supplied {config} to be
  // applied with each launch of your application, making it behave like the traditional #configure method.
  // https://github.com/transistorsoft/react-native-background-geolocation/blob/master/docs/README.md#resetconfig-successfn-failurefn
  // https://transistorsoft.github.io/react-native-background-geolocation/classes/_react_native_background_geolocation_.backgroundgeolocation.html#ready
  reset: true,
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
  preventSuspend: true, // default false (note true has major battery impact!) TODO

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
const haveReasonBesides = (reason: string) => Object.values(utils.objectWithoutKey(reasons, reason)).includes(true);

const newLocationEvent = (info: Location): LocationEvent => {
  const t = new Date(info.timestamp).getTime();
  return {
    ...timeseries.newSyncedEvent(t),
    type: EventType.LOC,
    data: {
      accuracy: info.coords.accuracy,
      ele: info.coords.altitude,
      heading: info.coords.heading,
      loc: [info.coords.longitude, info.coords.latitude],
      odo: info.odometer,
      speed: (info.coords.speed && info.coords.speed >= 0) ? metersPerSecondToMilesPerHour(info.coords.speed!)
        : undefined,
    },
  }
}

const newMotionEvent = (info: Location, isMoving: boolean): MotionEvent => {
  const t = new Date(info.timestamp).getTime();
  return {
    ...timeseries.newSyncedEvent(t),
    type: EventType.MOTION,
    data: { isMoving },
  }
}

const newModeChangeEvent = (activity: string, confidence: number): ModeChangeEvent => {
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
    type: EventType.MODE,
    data: {
      mode,
      confidence,
    },
  }
}

let reduxStore: Store | null = null;
let eventQueue: LocationEvents = [];

export const Geo = {

  initializeGeolocation: (store: Store) => {
    log.debug('initializeGeolocation');
    reduxStore = store;

    // Now, configure the plugin, using those options.
    BackgroundGeolocation.ready(geolocationOptions_default, pluginState => {

      const onActivityChange = (event: MotionActivityEvent) => {
        store.dispatch(newAction(AppAction.modeChange, newModeChangeEvent(event.activity, event.confidence)));
      }
      const onEnabledChange = (isEnabled: boolean) => {
      }
      const onGeofence = (event: GeofenceEvent) => {
      }
      const onGeofencesChange = (event: GeofencesChangeEvent) => {
      }
      const onHeartbeat = (event: HeartbeatEvent) => {
      }
      const onLocation = (location: Location) => {
        const locationEvent = newLocationEvent(location);
        const eventIsOld = locationEvent.t < utils.now() - constants.geolocationAgeThreshold;
        locationEvent.data.extra = `onLocation ${utils.now()} ${eventIsOld?'old':'new'}`; // TODO
        if (eventIsOld) {
          eventQueue.push(locationEvent);
        } else {
          let geolocationParams: GeolocationParams;
          // First, process everything in eventQueue as one batch, without rechecking map bounds yet.
          if (eventQueue.length) {
            geolocationParams = {
              locationEvents: eventQueue,
              recheckMapBounds: false,
            }
            store.dispatch(newAction(AppAction.geolocation, geolocationParams));
            eventQueue = []; // reset
          }
          // Now, handle the latest geolocation, with exactly one map bounds check, now that everything is added.
          geolocationParams = {
            locationEvents: [locationEvent],
            recheckMapBounds: true,
          }
          store.dispatch(newAction(AppAction.geolocation, geolocationParams));
        }
      }
      const onLocationError = (error: LocationError) => {
        log.warn('LocationError', error);
      }
      const onMotionChange = (event: MotionChangeEvent) => {
        store.dispatch(newAction(AppAction.motionChange, newMotionEvent(event.location, event.isMoving)));
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
    }, err => {
      log.error('BackgroundGeolocation failed to configure', err);
    })
  },

  changePace: (isMoving: boolean, done: Function) => {
    BackgroundGeolocation.changePace(isMoving, done);
  },

  enableBackgroundGeolocation: (enable: boolean): void => {
    log.debug('enableBackgroundGeolocation', enable);
    if (enable) {
      Geo.startBackgroundGeolocation('tracking');
      BackgroundGeolocation.setConfig(geolocationOptions_highPower);
      log.debug('using geolocationOptions_highPower');
    } else {
      Geo.stopBackgroundGeolocation('tracking');
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
  // Client who starts geolocation should specify a reason string, e.g. 'tracking' or 'following'.
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
          if (reduxStore) {
            if (reduxStore.getState().flags.appActive === false) {
              log.trace('BackgroundGeolocation.watchPosition receieveLocation', location);
              const locationEvent = newLocationEvent(location);
              locationEvent.data.extra = `watchPosition ${utils.now()}`; // TODO
              reduxStore.dispatch(newAction(AppAction.geolocation, {
                locationEvent: [locationEvent],
                recheckMapBounds: false,
              }))
            }
          } else {
            log.error('BackgroundGeolocation.watchPosition receieveLocation missing reduxStore');
          }
        }
        const options = {
          interval: 1000, // msec TODO move to constants
          persist: true, // to native SQLite database
        }
        if (reason === 'tracking') { // TODO
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
