/**
 * Running Tracker — AsyncStorage Persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_KEY = '@running_tracker_runs';
const SETTINGS_KEY = '@running_tracker_settings';
const PRESETS_KEY = '@running_tracker_challenge_presets';

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

export const saveChallengePresets = async (presets) => {
  try {
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Error saving challenge presets:', e);
  }
};

export const loadChallengePresets = async () => {
  try {
    const data = await AsyncStorage.getItem(PRESETS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error loading challenge presets:', e);
    return null;
  }
};
