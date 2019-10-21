// Geo: Configuration and support code related to react-native-background-geolocation.
// Includes LocationEvent interface.

// import * as turf from '@turf/helpers';
// import distance from '@turf/distance';

// For posting to tracker.transistorsoft.com
import DeviceInfo from 'react-native-device-info';

import { EMAIL_ADDRESS } from 'react-native-dotenv'; // deliberately omitted from repo

import BackgroundGeolocation, {
  // State,
  Config,
  Location,
  LocationError,
  // Geofence,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  HttpEvent,
  MotionActivityEvent,
  MotionChangeEvent,
  // ProviderChangeEvent,
  // ConnectivityChangeEvent
} from 'react-native-background-geolocation';

import { AppAction, GeolocationParams, newAction } from 'lib/actions';
import constants from 'lib/constants';
import store, { Store } from 'lib/store';
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

// TODO3
// pausesLocationUpdatesAutomatically: true, (sets disableStopDetection: true and prevents preventSuspend from working)

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
  // stopAfterElapsedMinutes: 30,
  persistMode: BackgroundGeolocation.PERSIST_MODE_ALL, // PERSIST_MODE_ALL is the default
  stopOnStationary: false, // default false

  // ----------------------------
  // Activity Recognition Options
  // ----------------------------

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
  debug: false, // with debug sounds, default false
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
}

// stopDetectionDelay is the time between when motion is still and accelerometer is monitored with GPS off.

const geolocationOptions_lowPower: Config = {
  ...geolocationOptions,

  // Specify the desired-accuracy of the geolocation system with 1 of 4 values, 0, 10, 100, 1000 where
  // 0 means HIGHEST POWER, HIGHEST ACCURACY and 1000 means LOWEST POWER, LOWEST ACCURACY
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,

  desiredOdometerAccuracy: 10, // Location accuracy threshold in meters for odometer calculations.

  distanceFilter: 10, // meters device must move to generate update event, default 10
  heartbeatInterval: 60, // rate in seconds to fire heartbeat events (default 60)
  preventSuspend: false, // default false TODO

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 10, // meters

  stopDetectionDelay: 1, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  // stopTimeout: 3, // Minutes to wait in moving state with no movement before considering the device stationary
}

const geolocationOptions_highPower: Config = {
  ...geolocationOptions,

  // desired time between activity detections.
  // Larger values will result in fewer activity detections while improving battery life.
  // A value of 0 will result in activity detections at the fastest possible rate.
  activityRecognitionInterval: 1000, // msec

  // Specify the desired-accuracy of the geolocation system with 1 of 4 values, 0, 10, 100, 1000 where
  // 0 means HIGHEST POWER, HIGHEST ACCURACY and 1000 means LOWEST POWER, LOWEST ACCURACY
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
  desiredOdometerAccuracy: 10, // Location accuracy threshold in meters for odometer calculations.

  distanceFilter: 1, // meters device must move to generate update event, default 10
  forceReloadOnBoot: true, // TODO
  heartbeatInterval: 60, // rate in seconds to fire heartbeat events (default 60)
  preventSuspend: true, // default false (note true has major battery impact!)
  maxDaysToPersist: 14, // TODO3
  startOnBoot: true, // set to true to enable background-tracking after the device reboots

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 1, // meters

  stopDetectionDelay: 5, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  stopOnTerminate: false,
  stopTimeout: 5, // Minutes to wait in moving state with no movement before considering the device stationary

  // logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE, // TODO3
  logLevel: BackgroundGeolocation.LOG_LEVEL_ERROR, // TODO3
  disableStopDetection: true, // TODO3
  persistMode: BackgroundGeolocation.PERSIST_MODE_ALL, // TODO3

  // TODO3 HTTP
  batchSync: true,
  params: BackgroundGeolocation.transistorTrackerParams(DeviceInfo),
  // params: {
  //   // Required for tracker.transistorsoft.com
  //   device: {
  //     uuid: (DeviceInfo.getModel() + '-' + DeviceInfo.getSystemVersion()).replace(/[\s\.,]/g, '-'),
  //     model: DeviceInfo.getModel(),
  //     platform: DeviceInfo.getSystemName(),
  //     manufacturer: DeviceInfo.getManufacturer(),
  //     version: DeviceInfo.getSystemVersion(),
  //     framework: 'ReactNative',
  //   },
  // },
  url: 'http://tracker.transistorsoft.com/locations/jondubman',
}

// const geolocationOptions_default: Config = geolocationOptions_lowPower; // TODO
const geolocationOptions_default: Config = geolocationOptions_highPower; // TODO3

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
    latIndexed: Math.round(info.coords.latitude * 1000000),
    lon: info.coords.longitude,
    lonIndexed: Math.round(info.coords.longitude * 1000000),
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

  initializeGeolocation: (store: Store, highPower: boolean = false) => {
    log.debug('initializeGeolocation');

    const onActivityChange = (event: MotionActivityEvent) => {
      const state = store.getState();
      const activityId = state.options.currentActivityId;
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
      BackgroundGeolocation.getCurrentPosition({ persist: true }, Geo.onLocation); // TODO3
    }
    const onHttp = (response: HttpEvent) => {
      // log.trace('BackgroundGeolocation onHttp', response);
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
      const activityId = state.options.currentActivityId;
      store.dispatch(newAction(AppAction.motionChange, newMotionEvent(event.location, event.isMoving, activityId)));
    }
    BackgroundGeolocation.onActivityChange(onActivityChange);
    BackgroundGeolocation.onEnabledChange(onEnabledChange);
    BackgroundGeolocation.onGeofence(onGeofence);
    BackgroundGeolocation.onGeofencesChange(onGeofencesChange);
    BackgroundGeolocation.onHeartbeat(onHeartbeat);
    BackgroundGeolocation.onHttp(onHttp);
    BackgroundGeolocation.onLocation(Geo.onLocation, onLocationError);
    BackgroundGeolocation.onMotionChange(onMotionChange);

    // Now, configure the plugin, using those options. TODO3 AHA
    BackgroundGeolocation.ready(highPower ? geolocationOptions_highPower : geolocationOptions_default,
    pluginState => {
      if (pluginState.enabled) {
        log.trace('BackgroundGeolocation configured and ready', pluginState);
      }
      BackgroundGeolocation.getCurrentPosition({}, Geo.onLocation); // fetch an initial location
    }, err => {
      log.error('BackgroundGeolocation failed to configure', err);
    })
  },

  changePace: (isMoving: boolean, done: Function) => {
    BackgroundGeolocation.changePace(isMoving, done);
  },

  destroyLocations: () => {
    BackgroundGeolocation.destroyLocations();
  },

  destroyLog: () => {
    BackgroundGeolocation.destroyLog();
  },

  emailLog: () => {
    if (EMAIL_ADDRESS) {
      BackgroundGeolocation.emailLog(EMAIL_ADDRESS);
    }
  },

  enableBackgroundGeolocation: async (enable: boolean) => {
    log.debug('enableBackgroundGeolocation', enable);
    if (enable) {
      await Geo.startBackgroundGeolocation('tracking');
      BackgroundGeolocation.setConfig(geolocationOptions_highPower);
      log.debug('using geolocationOptions_highPower');
    } else {
      // disable
      await Geo.stopBackgroundGeolocation('tracking');
      BackgroundGeolocation.setConfig(geolocationOptions_default);
      log.debug('using geolocationOptions_default');
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

  onLocation: async (location: Location) => {
    try {
      if (location.sample) {
        return;
      }
      const processLocation = async (location: Location) => {
        const state = store.getState();
        const activityId = state.options.currentActivityId;
        if (!state.flags.receiveLocations) {
          log.trace('processLocation: ignoring location', location.timestamp);
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
      const state = store.getState();
      if (state.flags.appActive) {
        await processLocation(location);
        return;
      }
      BackgroundGeolocation.startBackgroundTask().then(async (taskId) => {
        processLocation(location).then(() => {
          // When long-running task is complete, signal completion of taskId.
          setTimeout(() => {
            BackgroundGeolocation.stopBackgroundTask(taskId);
          }, constants.timing.backgroundTaskSlackTime);
        }).catch(() => {
          BackgroundGeolocation.stopBackgroundTask(taskId);
        })
      })
    } catch (err) {
      log.error('onLocation', err);
    }
  },

  processSavedLocations: async () => {
    try {
      const state = store.getState();
      if (!state.flags.receiveLocations) {
        log.trace('processSavedLocations: ignoring locations');
        return;
      }
      const activityId = state.options.currentActivityId;
      const locations = await BackgroundGeolocation.getLocations() as Location[];
      log.info('processSavedLocations: count ', locations.length);
      const locationEvents: LocationEvents = [];
      for (let location of locations) {
        if (location.sample) {
          continue;
        }
        const locationEvent = newLocationEvent(location, activityId);
        locationEvents.push(locationEvent);
      }
      if (locationEvents.length) {
        store.dispatch(newAction(AppAction.addEvents, { events: locationEvents }));
      }
      // Geo.destroyLocations(); // TODO3
      // TODO AppAction.geolocation?
    } catch (err) {
      log.error('processSavedLocations', err);
    }
  },

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
      return Promise.resolve(false);
    }
    reasons[reason] = true;
    // if (haveReasonBesides(reason)) {
    //   log.debug(`BackgroundGeolocation requested for ${reason}, already running`);
    //   log.trace('BackgroundGeolocation reasons', reasons);
    //   return false;
    // }
    return new Promise((resolve, reject) => {
      const started = () => {
        if (reason === 'tracking') {
          const options = {
            interval: constants.timing.watchPositionInterval,
            persist: true, // to native SQLite database (first stored by plugin, then provided to app and stored in Realm)
          }
          BackgroundGeolocation.watchPosition(Geo.onLocation, err => {
            log.error('BackgroundGeolocation.watchPosition', err);
            reject(err);
          }, options)
          resolve(true);
        }
      }
      BackgroundGeolocation.start(started, err => {
        log.error('BackgroundGeolocation.start', err);
        reject(err);
      })
    })
  },

  // Resolves to true if background geolocation was stopped as a result of this request
  // (It is left running if any reasons remain.)
  stopBackgroundGeolocation: async (reason: string) => {
    if (!reasons[reason]) {
      log.debug(`BackgroundGeolocation already inactive for ${reason} in stopBackgroundGeolocation`);
      log.trace('BackgroundGeolocation reasons', reasons);
      return Promise.resolve(false);
    }
    if (reason === 'tracking') {
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
      return Promise.resolve(false);
    }
    // return Promise.resolve(false); // TODO3 don't ever stop!
    return new Promise((resolve, reject) => {
      const done = () => {
        log.debug(`BackgroundGeolocation stopped, was running for ${reason}`);
        resolve(true);
      }
      BackgroundGeolocation.stop(done, err => { reject(err); }); // TODO3 probably don't ever want to stop!
    })
  },
}

// On heading vs course:
// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/LocationAwarenessPG/GettingHeadings/GettingHeadings.html
// Devices with a magnetometer can report the direction in which a device is pointing (aka heading).
// Devices with GPS hardware can report the direction in which a device is moving (aka course).
