/**
 * Running Tracker — Settings Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../utils/storage';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  unit: 'km',
  weight: 70, // kg
  weeklyGoal: 20000, // meters
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setIsLoading(false);
    })();
  }, []);

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

