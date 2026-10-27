/**
 * Running Tracker — Calculation Utilities
 */

/**
 * Convert degrees to radians.
 */
function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two GPS coordinates.
 * @returns {number} Distance in meters.
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance from an array of location points.
 * @param {Array<{latitude: number, longitude: number}>} locations
 * @returns {number} Total distance in meters.
 */
export function calculateDistance(locations) {
  if (!locations || locations.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += haversine(
      locations[i - 1].latitude,
      locations[i - 1].longitude,
      locations[i].latitude,
      locations[i].longitude,
    );
  }
  return total;
}

/**
 * Calculate pace in seconds per kilometer.
 * @param {number} distanceMeters
 * @param {number} durationSeconds
 * @returns {number} Seconds per km.
 */
export function calculatePace(distanceMeters, durationSeconds) {
  if (!distanceMeters || distanceMeters === 0) return 0;
  return (durationSeconds / distanceMeters) * 1000;
}

/**
 * Estimate calories burned using MET formula for running.
 * @param {number} distanceMeters
 * @param {number} weightKg
 * @returns {number}
 */
export function calculateCalories(distanceMeters, weightKg = 70) {
  // Roughly 1 kcal per kg per km for running
  const km = distanceMeters / 1000;
  return km * weightKg * 1.036;
}

/**
 * Calculate speed in m/s.
 * @param {number} distanceMeters
 * @param {number} durationSeconds
 * @returns {number}
 */
export function calculateSpeed(distanceMeters, durationSeconds) {
  if (!durationSeconds || durationSeconds === 0) return 0;
  return distanceMeters / durationSeconds;
}

/**
 * Get the start-of-week (Monday) for a given date.
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Group runs into weekly statistics.
 * @param {Array} runs
 * @returns {{ totalDistance: number, totalDuration: number, avgPace: number, runCount: number }}
 */
export function getWeeklyStats(runs) {
  const now = new Date();
  const weekStart = getWeekStart(now);

  const thisWeek = runs.filter(
    (r) => new Date(r.startTime) >= weekStart,
  );

  const totalDistance = thisWeek.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalDuration = thisWeek.reduce((sum, r) => sum + (r.duration || 0), 0);
  const avgPace =
    thisWeek.length > 0 ? calculatePace(totalDistance, totalDuration) : 0;

  return {
    totalDistance,
    totalDuration,
    avgPace,
    runCount: thisWeek.length,
  };
}

/**
 * Group runs into monthly statistics.
 * @param {Array} runs
 * @returns {{ totalDistance: number, totalDuration: number, avgPace: number, runCount: number }}
 */
export function getMonthlyStats(runs) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = runs.filter(
    (r) => new Date(r.startTime) >= monthStart,
  );

  const totalDistance = thisMonth.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalDuration = thisMonth.reduce((sum, r) => sum + (r.duration || 0), 0);
  const avgPace =
    thisMonth.length > 0 ? calculatePace(totalDistance, totalDuration) : 0;

  return {
    totalDistance,
    totalDuration,
    avgPace,
    runCount: thisMonth.length,
  };
}

/**
 * Get daily distances for the last N days.
 * @param {Array} runs
 * @param {number} days
 * @returns {Array<{date: string, distance: number, label: string}>}
 */
export function getDailyDistances(runs, days = 7) {
  const result = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayRuns = runs.filter((r) => {
      const rd = new Date(r.startTime);
      return rd >= date && rd < nextDay;
    });

    const distance = dayRuns.reduce((sum, r) => sum + (r.distance || 0), 0);

    result.push({
      date: date.toISOString(),
      distance,
      label: dayLabels[date.getDay()],
    });
  }

  return result;
}

/**
 * Calculate the current running streak (consecutive days with at least one run).
 * @param {Array} runs
 * @returns {number}
 */
export function getCurrentStreak(runs) {
  if (!runs || runs.length === 0) return 0;

  const runDates = new Set(
    runs.map((r) => {
      const d = new Date(r.startTime);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    if (runDates.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today doesn't count against if no run yet today
      continue;
    } else {
      break;
    }
  }

  return streak;
}

