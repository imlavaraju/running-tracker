/**
 * Running Tracker — Formatting Utilities
 */

/**
 * Format a duration in seconds to a human-readable string.
 * @param {number} totalSeconds
 * @returns {string} "HH:MM:SS" or "MM:SS" if under an hour
 */
export function formatDuration(totalSeconds) {
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format a distance in meters to the user's preferred unit.
 * @param {number} meters
 * @param {string} unit - 'km' or 'mi'
 * @returns {string} e.g. "5.23 km"
 */
export function formatDistance(meters, unit = 'km') {
  if (unit === 'mi') {
    return `${(meters / 1609.344).toFixed(2)} mi`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format distance as a raw number (no unit suffix).
 * @param {number} meters
 * @param {string} unit
 * @returns {string}
 */
export function formatDistanceValue(meters, unit = 'km') {
  if (unit === 'mi') {
    return (meters / 1609.344).toFixed(2);
  }
  return (meters / 1000).toFixed(2);
}

/**
 * Format pace (time per km or mile).
 * @param {number} secondsPerKm
 * @param {string} unit - 'km' or 'mi'
 * @returns {string} e.g. "5:30 /km"
 */
export function formatPace(secondsPerKm, unit = 'km') {
  let pace = secondsPerKm;
  if (unit === 'mi') {
    pace = secondsPerKm * 1.60934;
  }
  if (!pace || !isFinite(pace) || pace <= 0) return '--:-- /' + unit;
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} /${unit}`;
}

/**
 * Format a date string to a readable date.
 * @param {string} dateString - ISO date string
 * @returns {string} e.g. "Oct 27, 2026"
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string to a readable time.
 * @param {string} dateString - ISO date string
 * @returns {string} e.g. "3:30 PM"
 */
export function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format calories.
 * @param {number} calories
 * @returns {string}
 */
export function formatCalories(calories) {
  return `${Math.round(calories)} cal`;
}

/**
 * Get a relative date label.
 * @param {string} dateString
 * @returns {string} "Today", "Yesterday", "N days ago", or the formatted date
 */
export function getRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
}

