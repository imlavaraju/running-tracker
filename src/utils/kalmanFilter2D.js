/**
 * Lightweight 2D Kinematic Kalman Filter (Data Cleaning Pipeline)
 * 
 * Tracks state estimation [x (m), y (m), vx (m/s), vy (m/s)] in a local
 * East-North-Up (ENU) Cartesian frame to eliminate planar distortion and
 * smooth out GPS multipath reflections and architectural bounces.
 */

const EARTH_RADIUS = 6378137.0; // WGS84 Major Axis (meters)
const DEG_TO_RAD = Math.PI / 180.0;
const RAD_TO_DEG = 180.0 / Math.PI;

export class RealTime2DKalmanFilter {
  /**
   * @param {number} processNoiseSigma - Acceleration disturbance in m/s^2 (typically 2.0 - 4.0 for running)
   */
  constructor(processNoiseSigma = 3.0) {
    this.processNoiseSigma = processNoiseSigma;
    this.reset();
  }

  reset() {
    this.originLat = 0.0;
    this.originLng = 0.0;
    this.isInitialized = false;

    // State Vector [x, y, vx, vy]
    this.stateX = 0.0;
    this.stateY = 0.0;
    this.stateVx = 0.0;
    this.stateVy = 0.0;

    // Covariance Matrix (4x4)
    this.p00 = 100.0; this.p01 = 0.0;   this.p02 = 0.0;  this.p03 = 0.0;
    this.p10 = 0.0;   this.p11 = 100.0; this.p12 = 0.0;  this.p13 = 0.0;
    this.p20 = 0.0;   this.p21 = 0.0;   this.p22 = 25.0; this.p23 = 0.0;
    this.p30 = 0.0;   this.p31 = 0.0;   this.p32 = 0.0;  this.p33 = 25.0;

    this.lastTimestampMillis = 0;
  }

  /**
   * Process a new GPS location through Predict and Update steps.
   * @param {Object} loc - { latitude, longitude, accuracy, speed, timestamp }
   * @returns {{ latitude: number, longitude: number, speed: number, accuracy: number, timestamp: number }}
   */
  process(loc) {
    const lat = loc.latitude ?? loc.coords?.latitude;
    const lng = loc.longitude ?? loc.coords?.longitude;
    const accuracy = loc.accuracy ?? loc.coords?.accuracy ?? 10.0;
    const rawSpeed = loc.speed ?? loc.coords?.speed ?? 0.0;
    const timestamp = loc.timestamp || Date.now();

    if (!this.isInitialized) {
      this.originLat = lat;
      this.originLng = lng;
      this.stateX = 0.0;
      this.stateY = 0.0;
      this.stateVx = 0.0;
      this.stateVy = 0.0;

      const r = Math.max(accuracy * accuracy, 4.0);
      this.p00 = r;
      this.p11 = r;
      this.p22 = 10.0;
      this.p33 = 10.0;

      this.lastTimestampMillis = timestamp;
      this.isInitialized = true;

      return {
        latitude: lat,
        longitude: lng,
        speed: rawSpeed,
        accuracy,
        timestamp,
      };
    }

    const dt = Math.min(Math.max((timestamp - this.lastTimestampMillis) / 1000.0, 0.001), 10.0);
    this.lastTimestampMillis = timestamp;

    // --- STEP 1: PREDICT ---
    // State extrapolation: X = F * X
    this.stateX += this.stateVx * dt;
    this.stateY += this.stateVy * dt;

    // Continuous-time acceleration white noise formulation
    const dt2 = dt * dt;
    const dt3 = (dt2 * dt) / 2.0;
    const dt4 = (dt2 * dt2) / 4.0;
    const qVal = this.processNoiseSigma * this.processNoiseSigma;

    const q00 = dt4 * qVal; const q02 = dt3 * qVal;
    const q11 = dt4 * qVal; const q13 = dt3 * qVal;
    const q20 = dt3 * qVal; const q22 = dt2 * qVal;
    const q31 = dt3 * qVal; const q33 = dt2 * qVal;

    // Covariance extrapolation: P = F * P * F^T + Q
    const newP00 = this.p00 + dt * (this.p20 + this.p02 + dt * this.p22) + q00;
    const newP02 = this.p02 + dt * this.p22 + q02;
    const newP20 = this.p20 + dt * this.p22 + q20;
    const newP22 = this.p22 + q22;

    const newP11 = this.p11 + dt * (this.p31 + this.p13 + dt * this.p33) + q11;
    const newP13 = this.p13 + dt * this.p33 + q13;
    const newP31 = this.p31 + dt * this.p33 + q31;
    const newP33 = this.p33 + q33;

    this.p00 = newP00; this.p02 = newP02; this.p20 = newP20; this.p22 = newP22;
    this.p11 = newP11; this.p13 = newP13; this.p31 = newP31; this.p33 = newP33;

    // --- STEP 2: UPDATE ---
    // Project incoming GPS coordinate to local metric ENU Cartesian coordinates
    const meanLatRad = this.originLat * DEG_TO_RAD;
    const dLatRad = (lat - this.originLat) * DEG_TO_RAD;
    const dLngRad = (lng - this.originLng) * DEG_TO_RAD;

    const zx = dLngRad * EARTH_RADIUS * Math.cos(meanLatRad);
    const zy = dLatRad * EARTH_RADIUS;

    // Measurement noise variance
    const r = Math.max(accuracy * accuracy, 1.0);

    // Innovation / Residual: y = z - H * x
    const yx = zx - this.stateX;
    const yy = zy - this.stateY;

    // Innovation Covariance: S = H * P * H^T + R
    const s00 = this.p00 + r;
    const s11 = this.p11 + r;

    // Kalman Gain: K = P * H^T * S^-1
    const k00 = this.p00 / s00;
    const k20 = this.p20 / s00;
    const k11 = this.p11 / s11;
    const k31 = this.p31 / s11;

    // Correct State Vector: X = X + K * y
    this.stateX += k00 * yx;
    this.stateY += k11 * yy;
    this.stateVx += k20 * yx;
    this.stateVy += k31 * yy;

    // Correct Covariance: P = (I - K * H) * P
    this.p00 -= k00 * this.p00;
    this.p02 -= k00 * this.p02;
    this.p20 -= k20 * this.p00;
    this.p22 -= k20 * this.p02;

    this.p11 -= k11 * this.p11;
    this.p13 -= k11 * this.p13;
    this.p31 -= k31 * this.p11;
    this.p33 -= k31 * this.p13;

    // --- STEP 3: RE-PROJECT METRIC STATE BACK TO WGS84 ---
    const smoothedLat = this.originLat + (this.stateY / EARTH_RADIUS) * RAD_TO_DEG;
    const smoothedLng = this.originLng + (this.stateX / (EARTH_RADIUS * Math.cos(meanLatRad))) * RAD_TO_DEG;
    const smoothedSpeed = Math.sqrt(this.stateVx * this.stateVx + this.stateVy * this.stateVy);
    const estimatedAccuracy = Math.sqrt((this.p00 + this.p11) / 2.0);

    return {
      latitude: smoothedLat,
      longitude: smoothedLng,
      speed: smoothedSpeed,
      accuracy: estimatedAccuracy,
      timestamp,
    };
  }
}

/**
 * Google Maps Roads API: Snap to Roads network utility
 * Snaps up to 100 Kalman-smoothed coordinates to the actual road geometry.
 * 
 * @param {Array<{ latitude: number, longitude: number }>} points
 * @param {string} apiKey - Google Maps API Key
 * @param {boolean} interpolate - Whether to interpolate geometry between points
 * @returns {Promise<Array<{ latitude: number, longitude: number, placeId?: string }>>}
 */
export async function snapToRoads(points, apiKey, interpolate = true) {
  if (!points || points.length === 0 || !apiKey) {
    return points || [];
  }

  // Google Roads API allows max 100 points per batch
  const chunk = points.slice(0, 100);
  const pathParam = chunk.map((p) => `${p.latitude},${p.longitude}`).join('|');
  const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(pathParam)}&interpolate=${interpolate}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Roads API responded with status ${response.status}`);
    }
    const data = await response.json();
    if (data.snappedPoints && Array.isArray(data.snappedPoints)) {
      return data.snappedPoints.map((sp) => ({
        latitude: sp.location.latitude,
        longitude: sp.location.longitude,
        placeId: sp.placeId,
      }));
    }
    return chunk;
  } catch (error) {
    // If offline or network fails, return original smoothed coordinates gracefully
    return chunk;
  }
}

