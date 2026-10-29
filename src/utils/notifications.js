/**
 * Running Tracker — Notifications Utility
 * Configures notification channels and schedules recurring weekly reminders
 * for each enabled day based on the user's customized times.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Weekday mapping for Expo Notifications:
// 1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday
const WEEKDAY_MAP = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

// Set presentation handler so reminders trigger alerts and sounds
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Graceful fallback for environments where notifications are unavailable
}

/**
 * Configure Android notification channel
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('run-reminders', {
        name: 'Running Workout Reminders',
        description: 'Daily scheduled reminders to keep you on track with your running goals.',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803D',
        sound: 'default',
      });
    } catch (e) {
      // Ignore channel setup errors on unsupported environments
    }
  }
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermission() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * Parse a time string like "06:30 AM" or "07:45 PM" into 24h hour & minute
 */
export function parseTime(timeStr) {
  if (!timeStr) return { hour: 6, minute: 30 };
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return { hour: 6, minute: 30 };

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
}

/**
 * Cancel all existing scheduled notifications and schedule fresh weekly triggers
 * for all enabled days with their respective times.
 */
export async function syncScheduledReminders(dailyReminders) {
  try {
    await setupNotificationChannel();

    // Cancel all previously scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!Array.isArray(dailyReminders)) {
      return { success: true, scheduledCount: 0 };
    }

    const enabledReminders = dailyReminders.filter((d) => d.enabled);
    if (enabledReminders.length === 0) {
      return { success: true, scheduledCount: 0 };
    }

    // Check permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, reason: 'permission_denied', scheduledCount: 0 };
    }

    let scheduledCount = 0;

    for (const item of enabledReminders) {
      const weekday = WEEKDAY_MAP[item.id];
      if (!weekday) continue;

      const { hour, minute } = parseTime(item.time);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for your ${item.day} Run! 🏃`,
          body: `Lace up your shoes! Your scheduled run starts now (${item.time}).`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'run-reminders',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });

      scheduledCount++;
    }

    return { success: true, scheduledCount };
  } catch (error) {
    return { success: false, reason: error.message, scheduledCount: 0 };
  }
}

export const ACTIVE_RUN_NOTIF_ID = 'active-run-tracking-notification';

/**
 * Configure Android notification channel for active run tracking
 */
export async function setupRunTrackingChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('active-run-tracking', {
        name: 'Active Workout Tracking',
        description: 'Status notification while a workout is actively in progress.',
        importance: Notifications.AndroidImportance.HIGH,
        sound: undefined,
        vibrationPattern: null,
        enableLights: false,
      });
    } catch (e) {
      // Ignore channel setup errors
    }
  }
}

/**
 * Show notification when a run workout starts
 * Title: "run tracker"
 * Body: "track your running"
 */
export async function showRunActiveNotification() {
  try {
    await setupRunTrackingChannel();
    await requestNotificationPermission();

    // Dismiss any existing active notification first
    try {
      await Notifications.dismissNotificationAsync(ACTIVE_RUN_NOTIF_ID);
    } catch {}

    await Notifications.scheduleNotificationAsync({
      identifier: ACTIVE_RUN_NOTIF_ID,
      content: {
        title: 'run tracker',
        body: 'track your running',
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: 'active-run-tracking',
      },
      trigger: null,
    });
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Dismiss the active run notification when a workout finishes, stops, or discards
 */
export async function dismissRunActiveNotification() {
  try {
    await Notifications.dismissNotificationAsync(ACTIVE_RUN_NOTIF_ID);
  } catch (e) {
    try {
      await Notifications.cancelScheduledNotificationAsync(ACTIVE_RUN_NOTIF_ID);
    } catch {}
  }
}

