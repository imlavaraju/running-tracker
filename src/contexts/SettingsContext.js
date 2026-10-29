/**
 * Running Tracker — Settings Context
 * Unit, Pace/Speed display, Language, Multi-Day Reminders
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../utils/storage';
import { syncScheduledReminders } from '../utils/notifications';

const SettingsContext = createContext();

export const DEFAULT_WEEK_REMINDERS = [
  { id: 'mon', day: 'Monday', short: 'Mon', enabled: true, time: '06:30 AM' },
  { id: 'tue', day: 'Tuesday', short: 'Tue', enabled: true, time: '06:30 AM' },
  { id: 'wed', day: 'Wednesday', short: 'Wed', enabled: true, time: '06:30 AM' },
  { id: 'thu', day: 'Thursday', short: 'Thu', enabled: true, time: '06:30 AM' },
  { id: 'fri', day: 'Friday', short: 'Fri', enabled: true, time: '06:30 AM' },
  { id: 'sat', day: 'Saturday', short: 'Sat', enabled: false, time: '07:30 AM' },
  { id: 'sun', day: 'Sunday', short: 'Sun', enabled: false, time: '07:30 AM' },
];

export const DEFAULT_SETTINGS = {
  unit: 'km',               // 'km' | 'mi'
  metricDisplay: 'pace',    // 'pace' (min/km) | 'speed' (km/h)
  language: 'en',           // 'en' | 'es' | 'de' | 'fr' | 'hi' | 'te'
  dailyReminders: DEFAULT_WEEK_REMINDERS,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved) {
        // Clean out legacy weight & weeklyGoal if present
        const { weight, weeklyGoal, ...cleanSettings } = saved;
        let reminders = cleanSettings.dailyReminders;
        if (!reminders || !Array.isArray(reminders) || reminders.length === 0) {
          // If legacy reminderEnabled/reminderTime existed, migrate into week reminders
          if (cleanSettings.reminderTime) {
            reminders = DEFAULT_WEEK_REMINDERS.map((d) => ({
              ...d,
              time: cleanSettings.reminderTime,
              enabled: cleanSettings.reminderEnabled !== false,
            }));
          } else {
            reminders = DEFAULT_WEEK_REMINDERS;
          }
        }
        setSettings({
          ...DEFAULT_SETTINGS,
          ...cleanSettings,
          dailyReminders: reminders,
        });
        syncScheduledReminders(reminders).catch(() => {});
      }
      setIsLoading(false);
    })();
  }, []);

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  const updateDailyReminders = async (newReminders) => {
    await updateSettings({ dailyReminders: newReminders });
    await syncScheduledReminders(newReminders);
  };

  const toggleDayReminder = async (dayId) => {
    const list = (settings.dailyReminders || DEFAULT_WEEK_REMINDERS).map((d) =>
      d.id === dayId ? { ...d, enabled: !d.enabled } : d
    );
    await updateDailyReminders(list);
  };

  const setDayReminderTime = async (dayId, newTime) => {
    const list = (settings.dailyReminders || DEFAULT_WEEK_REMINDERS).map((d) =>
      d.id === dayId ? { ...d, time: newTime, enabled: true } : d
    );
    await updateDailyReminders(list);
  };

  const turnOnAllReminders = async () => {
    const list = (settings.dailyReminders || DEFAULT_WEEK_REMINDERS).map((d) => ({
      ...d,
      enabled: true,
    }));
    await updateDailyReminders(list);
  };

  const turnOffAllReminders = async () => {
    const list = (settings.dailyReminders || DEFAULT_WEEK_REMINDERS).map((d) => ({
      ...d,
      enabled: false,
    }));
    await updateDailyReminders(list);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateDailyReminders,
        toggleDayReminder,
        setDayReminderTime,
        turnOnAllReminders,
        turnOffAllReminders,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
