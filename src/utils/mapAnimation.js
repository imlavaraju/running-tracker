/**
 * Map Animation & Geodesic Interpolation Helper
 * Smooths marker transitions between consecutive GPS coordinates.
 */

const DEG_TO_RAD = Math.PI / 180.0;
const RAD_TO_DEG = 180.0 / Math.PI;

/**
 * Spherical Linear Interpolation (Slerp) between two LatLng coordinates
 * @param {number} fraction - Progress between 0.0 and 1.0
 * @param {{ latitude: number, longitude: number }} from
 * @param {{ latitude: number, longitude: number }} to
 * @returns {{ latitude: number, longitude: number }}
 */
export function interpolateSpherical(fraction, from, to) {
  if (!from || !to) return to || from;
  if (fraction <= 0) return from;
  if (fraction >= 1) return to;

  const fromLat = from.latitude * DEG_TO_RAD;
  const fromLng = from.longitude * DEG_TO_RAD;
  const toLat = to.latitude * DEG_TO_RAD;
  const toLng = to.longitude * DEG_TO_RAD;

  const cosFromLat = Math.cos(fromLat);
  const cosToLat = Math.cos(toLat);

  // Haversine central angle
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const a =
    Math.sin(dLat / 2) ** 2 +
    cosFromLat * cosToLat * Math.sin(dLng / 2) ** 2;
  const angle = 2 * Math.asin(Math.sqrt(a));

  if (Math.abs(angle) < 1e-6) {
    return from;
  }

  const sinAngle = Math.sin(angle);
  const weightFrom = Math.sin((1.0 - fraction) * angle) / sinAngle;
  const weightTo = Math.sin(fraction * angle) / sinAngle;

  const x = weightFrom * cosFromLat * Math.cos(fromLng) + weightTo * cosToLat * Math.cos(toLng);
  const y = weightFrom * cosFromLat * Math.sin(fromLng) + weightTo * cosToLat * Math.sin(toLng);
  const z = weightFrom * Math.sin(fromLat) + weightTo * Math.sin(toLat);

  const outLat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const outLng = Math.atan2(y, x);

  return {
    latitude: outLat * RAD_TO_DEG,
    longitude: outLng * RAD_TO_DEG,
  };
}

/**
 * Compute initial bearing heading in degrees (0 - 360) from point A to point B
 */
export function computeBearing(from, to) {
  if (!from || !to) return 0;
  const fromLat = from.latitude * DEG_TO_RAD;
  const toLat = to.latitude * DEG_TO_RAD;
  const dLng = (to.longitude - from.longitude) * DEG_TO_RAD;

  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * RAD_TO_DEG;
  return (bearing + 360.0) % 360.0;
}

