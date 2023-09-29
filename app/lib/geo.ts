// Geo: Configuration and support code related to react-native-background-geolocation.

// For posting to tracker.transistorsoft.com
// import DeviceInfo from 'react-native-device-info';

import { EMAIL_ADDRESS } from 'react-native-dotenv'; // deliberately omitted from repo

import BackgroundGeolocation, {
  // State,
  Config,
  Location,
  LocationAuthorizationRequest,
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

const Logger = BackgroundGeolocation.logger;

import {
  AppAction,
  GeolocationParams,
  newAction,
} from 'lib/actions';
import constants from 'lib/constants';
import {
  LocationEvent,
  LocationEvents,
  ModeChangeEvent,
  ModeType,
  MotionEvent
} from 'lib/locations';
import { AppState } from 'lib/state';
import store, { Store } from 'lib/store';
import utils from 'lib/utils';
import log from 'shared/log';
import timeseries, { EventType } from 'lib/timeseries';

// pausesLocationUpdatesAutomatically: true, (sets disableStopDetection: true and prevents preventSuspend from working)

const geoconfig_default: Config = {
  // --------------
  // Common Options
  // --------------
  distanceFilter: 3, // meters device must move to generate update event, default 10

  // set true to disable automatic speed-based #distanceFilter elasticity
  // (device moving at highway speeds -> locations returned at ~1/km)
  disableElasticity: true, // default false
  // stopAfterElapsedMinutes: 30,
  // stopOnStationary: false, // default false

  // ----------------------------
  // Activity Recognition Options
  // ----------------------------
  // number of minutes to wait before turning off location-services after the
  // ActivityRecognition System (ARS) detects the device is STILL.
  // stopTimeout: 3, // minutes

  // defaults to 0. Delays stop-detection system, in which location-services is turned off and only the accelerometer is monitored.
  // Stop-detection will only engage if this timer expires. The timer is cancelled if any movement is detected before expiration.
  // If 0, stop-detection system engages when device is stationary.
  // stopDetectionDelay: 1, // minutes

  // -------------------
  // Application Options
  // -------------------
  stopOnTerminate: false, // set false to continue tracking after user terminates the app
  startOnBoot: true, // set to true to enable background-tracking after the device reboots
  heartbeatInterval: 10, // rate in seconds to fire heartbeat events (default 60)

  // ------------------
  // Geofencing Options
  // ------------------
  // https://github.com/transistorsoft/react-native-background-geolocation/blob/master/docs/geofencing.md
  // Radius to query for geofences within proximity. Default 1000m.
  // When using Geofences, the plugin activates only those in proximity.
  // Only 20 geofences can be simultaneously monitored on iOS, and 100 on Android.
  // Plugin allows arbitrary # of geofences (thousands even). Plugin stores in its database
  // database and uses spatial queries to determine which 20 or 100 geofences to activate.
  // geofenceProximityRadius: 1000, // meters

  // Set false to disable triggering a geofence immediately if device is already inside it.
  // geofenceInitialTriggerEntry: true, // default true

  // -----------------------
  // Logging & Debug options
  // -----------------------
  // https://github.com/transistorsoft/react-native-background-geolocation/wiki/Debug-Sounds
  // debug: false, // with debug sounds, default false
  // iOS NOTE: In addition, you must manually enable the Audio and Airplay background mode
  // in Background Capabilities to hear these debugging sounds

  // ----------------
  // iOS-only options
  // ----------------
  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  // stationaryRadius: 1,
  // useSignificantChangesOnly: false, // default false
  locationAuthorizationRequest: 'Always' as LocationAuthorizationRequest, // either Always or WhenInUse
  // locationAuthorizationAlert: {}, // default {} TODO can customize

  // https://developer.apple.com/documentation/corelocation/cllocationmanager/1620567-activitytype
  // default 'Other'
  activityType: BackgroundGeolocation.ACTIVITY_TYPE_OTHER,
  // activityType: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS, // TODO
  // Note plugin is highly optimized for motion-activity-updates. Disabling these is not advised.
  // disableMotionActivityUpdates: false, // default false

  // Configure the initial tracking- state after BackgroundGeolocation.start is called.
  // The plugin will immediately enter the tracking-state, bypassing the stationary state.
  // If the device is not currently moving, the stop detection system will still engage.
  // After stopTimeout minutes without movement, the plugin will enter the stationary state, as usual.
  isMoving: true,
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION, // higher than DESIRED_ACCURACY_HIGH, on iOS
  desiredOdometerAccuracy: 30, // Location accuracy threshold in meters for odometer calculations (plugin default 100m)

  persistMode: BackgroundGeolocation.PERSIST_MODE_NONE,
  // Enable to prevent iOS from suspending when stationary. Must be used with a heartbeatInterval.
  preventSuspend: true, // TODO Is it better to use false here?

  showsBackgroundLocationIndicator: false,

  // when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 10, // meters

  // stopDetectionDelay is the time between when motion is still and accelerometer is monitored with GPS off.
  stopDetectionDelay: 3, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  stopTimeout: 5, // Minutes to wait in moving state with no movement before considering the device stationary
}

const geoconfig_tracking: Config = {
  ...geoconfig_default,

  disableStopDetection: false, // using false is vastly more power-efficient!
  distanceFilter: 1, // meters device must move to generate update event, default 10
  forceReloadOnBoot: true,
  // logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
  logLevel: BackgroundGeolocation.LOG_LEVEL_ERROR,
  preventSuspend: true, // default false (note true has major battery impact!)
  maxDaysToPersist: 14,
  persistMode: BackgroundGeolocation.PERSIST_MODE_NONE, // NONE when appactive, vs. geoconfig_tracking_background below

  // stationaryRadius: when stopped, the minimum distance (meters) the device must move beyond the stationary location
  // for aggressive background-tracking to engage (default 25)
  stationaryRadius: 1, // meters
  stopDetectionDelay: 10, // Allows the iOS stop-detection system to be delayed from activating after becoming still
  stopTimeout: 10, // Minutes to wait in moving state with no movement before considering the device stationary

  // TODO for diagnosis via HTTP POST
  // batchSync: true,
  // params: BackgroundGeolocation.transistorTrackerParams(DeviceInfo),
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
  // url: 'http://tracker.transistorsoft.com/locations/jondubman',
}

const geoconfig_tracking_background: Config = {
  ...geoconfig_tracking,
  persistMode: BackgroundGeolocation.PERSIST_MODE_ALL,
  showsBackgroundLocationIndicator: true,
}

// const geoconfig_movieMode: Config = {
//   ...geoconfig_default,  
//   stopOnTerminate: true,
//   startOnBoot: false,
// }

const mapActivityToMode = {
  in_vehicle: ModeType.VEHICLE,
  on_bicycle: ModeType.BICYCLE,
  on_foot: ModeType.ON_FOOT,
  running: ModeType.RUNNING,
  still: ModeType.STILL,
}

// Info from the plugin's Location object that we care about, that can also be reverse-engineered from PathInfo.
// This intermediate form is the missing link between location simulation and running background-geolocation for real.
// A LocationEvent is all the same info, in slightly modified form, to persist in the database, among general Events.
export interface LocationInfo {
  accuracy?: number;
  battery?: number;
  charging?: boolean;
  confidence?: number;
  ele?: number; // present in Path
  heading?: number;
  lat: number; // required, present in Path
  lon: number; // required, present in Path
  mode?: ModeType; // based on number present in Path
  odo?: number; // present in Path
  speed?: number; // present in Path
  t: number; // required, present in Path
}

const locationInfoFromLocation = (location: Location): LocationInfo => ({
  accuracy: location.coords.accuracy,
  battery: location.battery.level,
  charging: location.battery.is_charging,
  confidence: location.activity ? location.activity.confidence : 0,
  ele: location.coords.altitude,
  heading: location.coords.heading,
  lat: location.coords.latitude,
  lon: location.coords.longitude,
  mode: location.activity ? (mapActivityToMode[location.activity.activity] || null) : null,
  odo: Math.round(location.odometer), // It's meters and accuracy is not <1m. Half a meter on the odo is just confusing.
  speed: location.coords.speed, // meters per second
  t: new Date(location.timestamp).getTime(),
})

const newLocationEvent = (info: LocationInfo, activityId: string | undefined): LocationEvent => {
  return {
    ...timeseries.newEvent(info.t, activityId), // helper to construct an event object
    type: EventType.LOC,
    accuracy: info.accuracy,
    battery: info.battery,
    charging: info.charging,
    confidence: info.confidence,
    ele: info.ele,
    heading: info.heading,
    lat: info.lat,
    latIndexed: Math.round(info.lat * 1000000), // * 1 million
    lon: info.lon,
    lonIndexed: Math.round(info.lon * 1000000), // * 1 million
    mode: info.mode,
    odo: info.odo ? Math.round(info.odo) : undefined,
    speed: info.speed, // meters per second
  }
}

const newMotionEvent = (location: Location, isMoving: boolean, activityId: string | undefined): MotionEvent => {
  const t = new Date(location.timestamp).getTime();
  return {
    ...timeseries.newEvent(t, activityId),
    type: EventType.MOTION,
    isMoving,
  }
}

const newModeChangeEvent = (activity: string, confidence: number, activityId: string | undefined): ModeChangeEvent => {
  const t = utils.now(); // TODO
  const mode = mapActivityToMode[activity] || `unknown activity: ${activity}`;
  log.trace('newModeChangeEvent', activity, mode);
  return {
    ...timeseries.newEvent(t, activityId),
    type: EventType.MODE,
    mode,
    confidence,
  }
}

export const Geo = {

  // resolve to true if launched in background
  initializeGeolocation: async (store: Store, tracking: boolean = false) => {
    try {
      log.debug('initializeGeolocation: tracking', tracking);

      // Important: "Activity" in the context of this plugin is a very different notion from Activity in the app!
      // In the app, it's a whole tracking session with associated metadata.
      // Here, it is walking, bicycling, etc. which we refer to as a "mode" change.
      //
      // Note this is run whether appActive or not, unlike the location events which can be stored in the plugin's
      // SQLite DB when app is running in the background.
      // Caution: Use too much CPU in the background, and the app will be terminated by the OS CPU watchdog!
      const onActivityChange = (event: MotionActivityEvent) => {
        const state = store.getState();
        const {
          receiveActivityChangeEvents,
          trackingActivity,
        } = state.flags;
        if (!trackingActivity || !receiveActivityChangeEvents) {
          return;
        }
        const activityId = state.options.currentActivityId;
        if (activityId) {
          const modeChangeEvent = newModeChangeEvent(event.activity, event.confidence, activityId);
          store.dispatch(newAction(AppAction.modeChange, modeChangeEvent));
        }
      }
      const onEnabledChange = (isEnabled: boolean) => {
      }
      const onGeofence = (event: GeofenceEvent) => {
      }
      const onGeofencesChange = (event: GeofencesChangeEvent) => {
      }
      const onHeartbeat = async (event: HeartbeatEvent) => {
        try {
          const state = store.getState();
          if (!state.flags.receiveHeartbeatEvents) {
            return;
          }
          const { location } = event;
          log.debug('onHeartbeat', location.timestamp);
          Geo.onLocation(location);
        } catch (err) {
          log.warn('onHeartbeat error', err);
        }
      }
      const onHttp = (response: HttpEvent) => {
        const state = store.getState();
        if (state.flags.appActive) {
          log.trace('BackgroundGeolocation onHttp', response);
        }
      }
      const onMotionChange = (event: MotionChangeEvent) => {
        const state = store.getState();
        if (!state.flags.receiveMotionChangeEvents) {
          return;
        }
        if (state.flags.appActive) {
          const activityId = state.options.currentActivityId;
          if (activityId) {
            const motionEvent = newMotionEvent(event.location, event.isMoving, activityId);
            store.dispatch(newAction(AppAction.motionChange, motionEvent));
          }
        } else if (state.flags.trackingActivity) {
          BackgroundGeolocation.insertLocation(event.location);
        }
      }
      BackgroundGeolocation.onActivityChange(onActivityChange);
      BackgroundGeolocation.onEnabledChange(onEnabledChange);
      // TODO Geofences having issues with plugin version 3.9.0. As these are just stubs, removing for now.
      // BackgroundGeolocation.onGeofence(onGeofence);
      // BackgroundGeolocation.onGeofencesChange(onGeofencesChange);
      BackgroundGeolocation.onHeartbeat(onHeartbeat);
      BackgroundGeolocation.onHttp(onHttp);
      BackgroundGeolocation.onLocation(Geo.onLocation, Geo.onLocationError);
      BackgroundGeolocation.onMotionChange(onMotionChange);

      // Now, ready the plugin (required, once, at startup, before calling start)
      let config: Config = tracking ? geoconfig_tracking : geoconfig_default;
      if (utils.appInBackground()) {
        config = geoconfig_tracking_background;
      }
      await BackgroundGeolocation.ready(
        config,
        pluginState => {
          if (pluginState.enabled) {
            log.trace('BackgroundGeolocation configured and ready', pluginState);
          }
          // https://transistorsoft.github.io/react-native-background-geolocation/interfaces/_react_native_background_geolocation_.state.html#didlaunchinbackground
          log.trace(`BackgroundGeolocation didLaunchInBackground ${pluginState.didLaunchInBackground}`);
          BackgroundGeolocation.getCurrentPosition({}, Geo.onLocation); // fetch an initial location
          return pluginState.didLaunchInBackground;
        }, err => {
          log.error('BackgroundGeolocation failed to configure', err);
        }
      )
      log.trace('BackgroundGeolocation.ready completed');
    } catch (err) {
      log.error('BackgroundGeolocation exception', err);
    }
  },

  changePace: async (isMoving: boolean, done: Function) => {
    try {
      await BackgroundGeolocation.changePace(isMoving, done);
    } catch (err) {
      log.error('geo changePace', err);
    }
  },

  countLocations: async (): Promise<number | undefined> => {
    try {
      const count = await BackgroundGeolocation.getCount();
      log.info(`BackgroundGeolocation SQLite count ${count}`);
      return count;
    } catch (err) {
      log.error('geo countLocations', err);
      return undefined;
    }
  },

  destroyLocations: async () => {
    try {
      await BackgroundGeolocation.destroyLocations();
    } catch (err) {
      log.error('geo destroyLocations', err);
    }
  },

  destroyLog: async () => {
    try {
      await Logger.destroyLog();
    } catch (err) {
      log.error('geo destroyLog', err);
    }
  },

  // for debugging
  emailLog: async () => {
    try {
      if (EMAIL_ADDRESS) {
        await Logger.emailLog(EMAIL_ADDRESS);
      }
    } catch (err) {
      log.error('geo emailLog', err);
    }
  },

  // Set configuration for background geolocation as appropriate given current app state. This should be idempotent.
  // This is required to receive locations in the foreground and background.
  setConfig: async (tracking: boolean = false, background: boolean = false) => {
    try {
      const config = tracking ? (background ? geoconfig_tracking_background : geoconfig_tracking) : geoconfig_default;
      log.trace(`Geo.setConfig tracking: ${tracking}, background: ${background}, config: ${JSON.stringify(config)}`);
      BackgroundGeolocation.setConfig(
        config,
      ).then(() => {
        log.trace(`Geo.setConfig done`);
      })
    } catch (err) {
      log.error('Geo.setConfig', err);
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
      const state = store.getState();
      if (location.sample || !state.flags.receiveLocations || state.options.locationSimulation.activityId) {
        return;
      }
      const {
        appActive,
        movieMode,
        storeAllLocationEvents,
        trackingActivity,
      } = state.flags;
      if (movieMode) {
        return; // never show real location in movieMode
      }
      const activityId = state.options.currentActivityId || '';
      if (appActive) {
        // log.trace(`onLocation: appActive ${location.timestamp}, tracking ${trackingActivity}`);
        const locationInfo = locationInfoFromLocation(location);
        const locationEvent = newLocationEvent(locationInfo, activityId);
        const geoloc: GeolocationParams = {
          locationEvent,
          t: new Date(location.timestamp).getTime(),
          recheckMapBounds: true,
        }
        store.dispatch(newAction(AppAction.geolocation, geoloc));
        if (activityId || storeAllLocationEvents) {
          // Adding events will yield a cascade of updates in the database, the store, and ultimately the UI.
          store.dispatch(newAction(AppAction.addEvents, { events: [locationEvent] }));
        }
      } else {
        // App is running (obviously!) but in the BACKGROUND.
        if (trackingActivity) {
          // Add the raw location to the plugin's SQLite DB so they will be included in processSavedLocations
          // in addition to the locations that come in when the RN JS thread is asleep.
          // Note: Could await insertLocation as it returns a promise, or check for errors if needed.
          BackgroundGeolocation.insertLocation(location);
          // TODO It seems that merely logging here can consume enough CPU for app to get killed in the background!
          // log.trace(`onLocation: inserting location in background ${location.timestamp}`);
        } else {
          // trackingActivity in the background.
          // BackgroundGeolocation.insertLocation(location); // TODO These should be persisted by the plug-in.
          // log.trace(`onLocation: in background, not tracking ${location.timestamp}`);
        }
      }
    } catch (err) {
      log.error('onLocation', err);
    }
  },

  onLocationError: (error: LocationError) => {
    const state = store.getState();
    if (state.flags.appActive) {
      let errorMessage;
      if (error === 0) errorMessage = 'Location unknown';
      if (error === 1) errorMessage = 'Location permission denied';
      if (error === 2) errorMessage = 'Location network error';
      if (error === 408) errorMessage = 'Location timeout';
      log.info('LocationError', errorMessage || error);
    }
  },

  // There's overlap between onSimulateLocation and onLocation, but onSimulateLocation takes locationInfo, as opposed to
  // the plugin's Location object, and does nothing in the background, because location simulation is foreground only
  // and doesn't insertLocation into the plugin's internal SQLite DB.
  onSimulateLocation: async (locationInfo: LocationInfo, state: AppState, forceModeChange: boolean = false) => {
    try {
      if (!state.options.locationSimulation.activityId) {
        return; // early return if locationSimulation is not currently enabled
      }
      const activityId = state.options.currentActivityId || '';
      log.debug('onSimulateLocation', locationInfo, activityId);
      const {
        appActive,
        receiveActivityChangeEvents,
        receiveLocations,
        storeAllLocationEvents,
        trackingActivity,
      } = state.flags;
      if (!receiveLocations) {
        return;
      }
      if (appActive) {
        if (activityId && trackingActivity && receiveActivityChangeEvents) {
          if (state.userLocation?.mode !== locationInfo.mode || forceModeChange) {
            const modeChangeEvent = {
              ...timeseries.newEvent(locationInfo.t, activityId!),
              type: EventType.MODE,
              mode: locationInfo.mode,
              confidence: 100, // 100%, total confidence!
            }
            store.dispatch(newAction(AppAction.modeChange, modeChangeEvent));
          }
        }
        const locationEvent = newLocationEvent(locationInfo, activityId);
        const geoloc: GeolocationParams = {
          locationEvent,
          t: locationInfo.t,
          recheckMapBounds: true,
        }
        store.dispatch(newAction(AppAction.geolocation, geoloc));
        if (activityId || storeAllLocationEvents) {
          // Adding events will yield a cascade of updates in the database, the store, and ultimately the UI.
          store.dispatch(newAction(AppAction.addEvents, { events: [locationEvent] }));
        }
      } // else take no action
    } catch (err) {
      log.error('onSimulateLocation', err);
    }
  },

  // This is called in one context only, when the app transitions to the ACTIVE state, for the purpose of processing
  // all locations saved by react-native-background-geolocation in its internal SQLite DB. The raw locations are
  // converted to Pathify events with the help of newLocationEvent. The resulting events are added at once via
  // AppAction.addEvents, which currently assumes the events are sequential and associated with the same activityId.
  processSavedLocations: async () => {
    try {
      const state = store.getState();
      if (state.flags.recoveryMode || !state.flags.receiveLocations) {
        log.trace('processSavedLocations: ignoring locations');
        return;
      }
      // Insert a batch at a time instead of all locations at once to avoid blocking the UI thread.
      const { batchSize, sleepBetweenSteps } = constants.processSavedLocations;
      const activityId = state.options.currentActivityId;
      const locations = await BackgroundGeolocation.getLocations() as Location[];
      const total = locations.length;
      log.info(`processSavedLocations: total count: ${total}`);

      await new Promise(resolve => setTimeout(resolve, sleepBetweenSteps));

      // Step 1: Preprocess locations, thus:
      // Shuffle the locations such that there is a big enough sampling at the start to show the basic outline of
      // the path under most circumstances, if we can't show the completed path immediately.
      let initialBatch: Location[] = [];
      const initialBatchInterval = Math.max(1, Math.floor(locations.length / batchSize)); // Integer >= 1
      let rest: Location[] = [];

      let count = 0;
      for (const loc of locations) {
        if (initialBatchInterval > 1 && count % initialBatchInterval > 0) {
          rest.push(loc);
        } else {
          // When count is a multiple of initialBatchInterval, we arrive here. This is best understood with an exanple.
          // If there are 1200 new locations and the batchSize is 100, the initialBatchInterval will be 12.
          // This means, we'll sample every 12th location, starting with the first, yielding batchSize (100) locations
          // in this initialBatch. The rest go into... rest, above.
          // If, however, there are fewer than batchSize locations to process, everything ends up in this initialBatch.
          initialBatch.push(loc);
        }
        count += 1;
      }
      const preprocessedLocations = initialBatch.concat(rest);

      // Step 2: Now that we have preprocessedLocations, process them all, a batch at a time.

      if (preprocessedLocations.length && activityId) {
        let lastNewEvent: LocationEvent | null = null;
        while (preprocessedLocations.length) {
          const locationEvents: LocationEvents = [];
          const batch = preprocessedLocations.splice(0, batchSize); // This shrinks preprocessedLocations.

          // Process each batch in sequence
          for (const location of batch) {
            if (!location.sample) { // ignore sample locations
              const locationInfo = locationInfoFromLocation(location);
              const locationEvent = newLocationEvent(locationInfo, activityId);
              locationEvents.push(locationEvent);
            }
          }
          locationEvents.sort((e1: LocationEvent, e2: LocationEvent) => (e1.t - e2.t));

          store.dispatch(newAction(AppAction.addEvents, { events: locationEvents, preventRefresh: true }));
          log.debug(`added ${locationEvents.length} locationEvents, ${preprocessedLocations.length} remaining`);
          lastNewEvent = locationEvents[locationEvents.length - 1];

          await new Promise(resolve => setTimeout(resolve, sleepBetweenSteps));
        }
        store.dispatch(newAction(AppAction.refreshActivity, { id: activityId }));
        await new Promise(resolve => setTimeout(resolve, sleepBetweenSteps));

        if (lastNewEvent) {
          // AppAction.geolocation
          const geoloc: GeolocationParams = {
            locationEvent: lastNewEvent,
            recheckMapBounds: true,
            t: new Date(lastNewEvent.t).getTime(),
          }
          store.dispatch(newAction(AppAction.geolocation, geoloc));
        }
        // TODO any conceivable possibility of data loss here if there was some kind of uncaught error above?
        await Geo.destroyLocations(); // This can be slightly postponed in order to focus on processing the new data.
      }
    } catch (err) {
      log.error('processSavedLocations', err);
    }
  },

  requestPermission: async () => {
    try {
      log.debug('requestPermission');
      return await BackgroundGeolocation.requestPermission();
    } catch (err) {
      log.error('requestPermission', err);
      return;
    }
  },

  // Never do this in production; it would confuse the odometer for activities. As all the odometer calculation is
  // relative, it shouldn't matter anyway; this may be useful only for testing.
  //
  // resetOdometer: async () => {
  //   try {
  //     const done = () => {
  //       log.debug('resetOdometer done');
  //     }
  //     await BackgroundGeolocation.resetOdometer(done);
  //   } catch (err) {
  //     log.error('resetOdometer', err);
  //   }
  // },

  startBackgroundGeolocation: async () => {
    try {
      log.debug('startBackgroundGeolocation');
      return await BackgroundGeolocation.start();
    } catch (err) {
      log.error('startBackgroundGeolocation', err);
      return;
    }
  },

  stopBackgroundGeolocation: async () => {
    return await BackgroundGeolocation.stop();
  },
}

// On heading vs course:
// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/LocationAwarenessPG/GettingHeadings/GettingHeadings.html
// Devices with a magnetometer can report the direction in which a device is pointing (aka heading).
// Devices with GPS hardware can report the direction in which a device is moving (aka course).
