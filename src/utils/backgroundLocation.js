/**
 * Foreground Service & Background GPS Location Manager
 * Powered by expo-location & expo-task-manager.
 * 
 * Pipeline:
 * Raw GPS -> Velocity Location Gate -> 2D Kinematic Kalman Filter -> In-Memory Cache -> Active UI
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { VelocityLocationGate } from './locationGate';
import { RealTime2DKalmanFilter } from './kalmanFilter2D';

export const RUN_TRACKER_BG_TASK = 'RUN_TRACKER_BACKGROUND_LOCATION_TASK';

// Shared Filter & Pipeline Singletons
const locationGate = new VelocityLocationGate();
const kalmanFilter = new RealTime2DKalmanFilter(3.0);

// In-Memory Thread-Safe Trip Cache Queue (Survives configuration changes & backgrounding)
class ActiveTripCache {
  constructor() {
    this.points = [];
    this.listeners = new Set();
  }

  append(point) {
    this.points.push(point);
    this.notify(point);
  }

  getSnapshot() {
    return [...this.points];
  }

  size() {
    return this.points.length;
  }

  clear() {
    this.points = [];
    locationGate.reset();
    kalmanFilter.reset();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(point) {
    this.listeners.forEach((listener) => {
      try {
        listener(point, this.getSnapshot());
      } catch (err) {
        // Safe listener execution
      }
    });
  }
}

export const activeTripCache = new ActiveTripCache();

/**
 * Global Background Task Definition
 * Executes even when the app is in the background or screen is locked.
 */
if (!TaskManager.isTaskDefined(RUN_TRACKER_BG_TASK)) {
  TaskManager.defineTask(RUN_TRACKER_BG_TASK, async ({ data, error }) => {
    if (error) {
      return;
    }

    if (data && data.locations && Array.isArray(data.locations)) {
      for (const rawLoc of data.locations) {
        processRawCoordinate(rawLoc);
      }
    }
  });
}

/**
 * Ingest and clean incoming raw coordinates via Gate + 2D Kalman Filter
 */
export function processRawCoordinate(rawLoc) {
  if (!rawLoc || !rawLoc.coords) return null;

  // Step 1: Velocity-Based Gate Filtering
  const gateResult = locationGate.filter(rawLoc);
  if (!gateResult.accepted) {
    return null;
  }

  // Step 2: 2D Kalman Filter Smoothing
  const smoothed = kalmanFilter.process(gateResult.location);

  const cleanPoint = {
    latitude: smoothed.latitude,
    longitude: smoothed.longitude,
    speed: smoothed.speed,
    accuracy: smoothed.accuracy,
    altitude: rawLoc.coords.altitude ?? 0,
    timestamp: smoothed.timestamp,
  };

  // Step 3: Append to in-memory trip cache & notify UI
  activeTripCache.append(cleanPoint);
  return cleanPoint;
}

/**
 * Start Foreground Service & Continuous Location Updates
 */
export async function startForegroundLocationTracking() {
  activeTripCache.clear();

  // 1. Check & Request Standard Location Permission
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    return false;
  }

  // 2. Start Location Updates with Foreground Service notification
  const isStarted = await Location.hasStartedLocationUpdatesAsync(RUN_TRACKER_BG_TASK).catch(() => false);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(RUN_TRACKER_BG_TASK).catch(() => {});
  }

  await Location.startLocationUpdatesAsync(RUN_TRACKER_BG_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 2000,
    distanceInterval: 3,
    deferredUpdatesInterval: 2000,
    pausesLocationUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'run tracker',
      notificationBody: 'track your running',
      notificationColor: '#00E676',
    },
  });

  return true;
}

/**
 * Stop Foreground Service & Location Updates
 */
export async function stopForegroundLocationTracking() {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(RUN_TRACKER_BG_TASK).catch(() => false);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(RUN_TRACKER_BG_TASK);
    }
  } catch (err) {
    // Graceful teardown
  }
}

