/**
 * Running Tracker — AsyncStorage Persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_KEY = '@running_tracker_runs';
const SETTINGS_KEY = '@running_tracker_settings';

export const saveRuns = async (runs) => {
  try {
    await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch (e) {
    console.error('Error saving runs:', e);
  }
};

export const loadRuns = async () => {
  try {
    const data = await AsyncStorage.getItem(RUNS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading runs:', e);
    return [];
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const loadSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error loading settings:', e);
    return null;
  }
};

