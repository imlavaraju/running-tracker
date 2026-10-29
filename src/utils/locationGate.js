/**
 * Velocity-Based Input Gate (Smart In-App Collection)
 * 
 * Intercepts raw Location objects directly from the location provider.
 * Filters out:
 * 1. Low accuracy measurements (> 25 meters).
 * 2. Unphysical teleportation/velocity spikes (> realistic threshold, e.g. 12 m/s).
 * 3. Static drift / jitter while stationary to prevent spiderweb zig-zags.
 */

import { calculateDistance } from './calculations';

export const GateRejectionReason = {
  ACCURACY_TOO_POOR: 'ACCURACY_TOO_POOR',
  EXCESSIVE_VELOCITY_SPIKE: 'EXCESSIVE_VELOCITY_SPIKE',
  STATIC_DRIFT_JITTER: 'STATIC_DRIFT_JITTER',
  OUTDATED_OR_NEGATIVE_TIME: 'OUTDATED_OR_NEGATIVE_TIME',
};

export class VelocityLocationGate {
  constructor(config = {}) {
    this.config = {
      maxAccuracyMeters: config.maxAccuracyMeters ?? 25.0,
      maxRealisticVelocityMps: config.maxRealisticVelocityMps ?? 12.0, // ~43 km/h for running/sprinting
      minStationaryDistanceMeters: config.minStationaryDistanceMeters ?? 2.5,
      minStationarySpeedMps: config.minStationarySpeedMps ?? 0.5,
      ...config,
    };
    this.lastAcceptedLocation = null;
  }

  /**
   * Filters incoming raw location.
   * @param {Object} rawLoc - { coords: { latitude, longitude, accuracy, speed }, timestamp }
   * @returns {{ accepted: boolean, location?: Object, reason?: string }}
   */
  filter(rawLoc) {
    if (!rawLoc || !rawLoc.coords) {
      return { accepted: false, reason: 'INVALID_LOCATION' };
    }

    const { latitude, longitude, accuracy, speed } = rawLoc.coords;
    const timestamp = rawLoc.timestamp || Date.now();

    // 1. Horizontal Accuracy Threshold Check
    if (typeof accuracy === 'number' && accuracy > this.config.maxAccuracyMeters) {
      return { accepted: false, reason: GateRejectionReason.ACCURACY_TOO_POOR, location: rawLoc };
    }

    // First location is accepted as reference anchor
    if (!this.lastAcceptedLocation) {
      this.lastAcceptedLocation = {
        coords: { latitude, longitude, accuracy, speed: speed ?? 0 },
        timestamp,
      };
      return { accepted: true, location: rawLoc };
    }

    // 2. High-precision Time Delta Calculation (seconds)
    const timeDeltaSeconds = (timestamp - this.lastAcceptedLocation.timestamp) / 1000.0;

    if (timeDeltaSeconds <= 0) {
      return { accepted: false, reason: GateRejectionReason.OUTDATED_OR_NEGATIVE_TIME, location: rawLoc };
    }

    // 3. Geodesic Distance Delta (meters via Haversine)
    const distanceDeltaMeters = calculateDistance([
      { latitude: this.lastAcceptedLocation.coords.latitude, longitude: this.lastAcceptedLocation.coords.longitude },
      { latitude, longitude },
    ]);

    // 4. Implied Velocity Check (m/s)
    const impliedVelocity = distanceDeltaMeters / timeDeltaSeconds;
    if (impliedVelocity > this.config.maxRealisticVelocityMps) {
      return { accepted: false, reason: GateRejectionReason.EXCESSIVE_VELOCITY_SPIKE, location: rawLoc };
    }

    // 5. Static Drifting / Stationary Anti-Spiderweb Filter
    const hasSpeed = typeof speed === 'number' && speed >= 0;
    const isHardwareStationary = hasSpeed && speed < this.config.minStationarySpeedMps;
    const isDistanceStationary = distanceDeltaMeters < this.config.minStationaryDistanceMeters;
    const isNoiseFloor = typeof accuracy === 'number' && distanceDeltaMeters < accuracy * 0.35;

    if (isHardwareStationary || (isDistanceStationary && isNoiseFloor)) {
      return { accepted: false, reason: GateRejectionReason.STATIC_DRIFT_JITTER, location: rawLoc };
    }

    // Accept and commit as new last valid coordinate
    this.lastAcceptedLocation = {
      coords: { latitude, longitude, accuracy, speed: speed ?? 0 },
      timestamp,
    };

    return { accepted: true, location: rawLoc };
  }

  reset() {
    this.lastAcceptedLocation = null;
  }
}

