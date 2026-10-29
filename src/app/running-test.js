/**
 * Running Test / Exam Mode Screen
 * User enters target KM & minutes, or picks from saved challenge presets.
 * Save as Preset functionality for 1-click launch.
 * Shows required pace, live countdown tracking, pace comparison.
 * Auto-evaluates & saves when time expires or when stopped.
 * Unified flat vector iconography and WCAG AA contrast.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Vibration, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useRuns } from '../contexts/RunContext';
import { useSettings } from '../contexts/SettingsContext';
import { calculateDistance, calculatePace, calculateCalories } from '../utils/calculations';
import { formatDistance, formatPace, formatDuration, formatDistanceValue } from '../utils/formatters';
import { loadChallengePresets, saveChallengePresets } from '../utils/storage';
import { showRunActiveNotification, dismissRunActiveNotification } from '../utils/notifications';
import {
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  activeTripCache,
  processRawCoordinate,
} from '../utils/backgroundLocation';

const LOCATION_INTERVAL = 3000;
const LOCATION_DISTANCE = 5;

const DEFAULT_PRESETS = [
  { id: 'p1', name: 'Cooper Test', km: 2.4, minutes: 12, isDefault: true },
  { id: 'p2', name: '5K Benchmark', km: 5.0, minutes: 25, isDefault: true },
  { id: 'p3', name: '10K Exam', km: 10.0, minutes: 55, isDefault: true },
  { id: 'p4', name: 'Speed Mile', km: 1.6, minutes: 8, isDefault: true },
];

export default function RunningTestScreen() {
  const { addRun } = useRuns();
  const { settings } = useSettings();
  const unit = settings.unit;

  // Phase: 'setup' | 'running' | 'paused' | 'finished'
  const [phase, setPhase] = useState('setup');

  // Challenge inputs
  const [targetKm, setTargetKm] = useState('5.0');
  const [targetMinutes, setTargetMinutes] = useState('25');

  // Presets state
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState('p2');
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Tracking state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [locations, setLocations] = useState([]);
  const [distance, setDistance] = useState(0);
  const [initialCoords, setInitialCoords] = useState(null);

  // Results (shown in 'finished' phase)
  const [result, setResult] = useState(null);

  // Refs
  const timerRef = useRef(null);
  const locationSub = useRef(null);
  const startTimeRef = useRef(null);
  const locationsRef = useRef([]);
  const elapsedRef = useRef(0);
  const distanceRef = useRef(0);
  const timeExpiredSavedRef = useRef(false);
  const mapRef = useRef(null);

  // Fetch initial coordinate on mount to center map
  useEffect(() => {
    (async () => {
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && last.coords) {
          setInitialCoords(last.coords);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: last.coords.latitude,
                longitude: last.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              },
              400
            );
          }
        }
      } catch {}
    })();
  }, []);

  // Follow runner on map when locations update
  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      const latest = locations[locations.length - 1];
      mapRef.current.animateToRegion(
        {
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [locations]);

  // Load saved presets on mount
  useEffect(() => {
    (async () => {
      const saved = await loadChallengePresets();
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setPresets(saved);
      } else {
        await saveChallengePresets(DEFAULT_PRESETS);
      }
    })();
  }, []);

  const targetSeconds = parseFloat(targetMinutes || '0') * 60;
  const targetMeters = parseFloat(targetKm || '0') * 1000;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  // Required pace for the challenge (seconds per km)
  const requiredPace = targetMeters > 0 && targetSeconds > 0
    ? (targetSeconds / targetMeters) * 1000
    : 0;

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTargetKm(String(preset.km));
    setTargetMinutes(String(preset.minutes));
    try {
      Haptics.selectionAsync();
    } catch {}
  };

  // Save current target as a new preset
  const handleOpenSavePreset = () => {
    const km = parseFloat(targetKm);
    const min = parseFloat(targetMinutes);
    if (!km || km <= 0 || !min || min <= 0) {
      Alert.alert('Invalid Challenge', 'Enter a valid target distance and time first.');
      return;
    }
    setNewPresetName(`${km}km in ${min}min Exam`);
    setIsSaveModalVisible(true);
  };

  const handleConfirmSavePreset = async () => {
    const km = parseFloat(targetKm);
    const min = parseFloat(targetMinutes);
    const name = newPresetName.trim() || `${km}km in ${min}min`;

    const newPreset = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      km,
      minutes: min,
      isDefault: false,
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    setSelectedPresetId(newPreset.id);
    await saveChallengePresets(updated);
    setIsSaveModalVisible(false);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleDeletePreset = async (presetId) => {
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
    }
    await saveChallengePresets(updated);
  };

  // Subscribe to background & foreground filtered location updates
  useEffect(() => {
    const unsubscribe = activeTripCache.subscribe((newPoint, allPoints) => {
      locationsRef.current = allPoints;
      setLocations([...allPoints]);
      const newDist = calculateDistance(allPoints);
      distanceRef.current = newDist;
      setDistance(newDist);
    });
    return () => unsubscribe();
  }, []);

  // Timer — counts up using wall-clock to maintain precision when swapped or backgrounded
  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - new Date(startTimeRef.current).getTime()) / 1000
          );
          setElapsedSeconds(elapsed);
          elapsedRef.current = elapsed;
        } else {
          setElapsedSeconds((s) => {
            const next = s + 1;
            elapsedRef.current = next;
            return next;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Watch for time expiry
  useEffect(() => {
    if (
      phase === 'running' &&
      targetSeconds > 0 &&
      elapsedSeconds >= targetSeconds &&
      !timeExpiredSavedRef.current
    ) {
      timeExpiredSavedRef.current = true;
      handleTimeExpired();
    }
  }, [elapsedSeconds, phase, targetSeconds]);

  // Location tracking via Foreground Service + In-App Fallback
  const startLocationTracking = useCallback(async () => {
    const hasServices = await Location.hasServicesEnabledAsync();
    if (!hasServices) {
      Alert.alert(
        'Location Is Turned Off',
        'Device location service is required to track challenge distance. Please turn it on in device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Running Tracker requires location permission to track your challenge distance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    // Start Foreground Service for continuous background tracking
    try {
      const bgStarted = await startForegroundLocationTracking();
      if (bgStarted) {
        return true;
      }
    } catch (err) {
      // Fall through to watchPositionAsync
    }

    // Foreground fallback
    try {
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 3,
        },
        (loc) => {
          processRawCoordinate(loc);
        }
      );
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    stopForegroundLocationTracking();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      if (timerRef.current) clearInterval(timerRef.current);
      dismissRunActiveNotification();
    };
  }, [stopLocationTracking]);

  // Build a result object from current state
  const buildResult = (overrideDuration) => {
    const duration = overrideDuration ?? elapsedRef.current;
    const dist = distanceRef.current;
    const pace = calculatePace(dist, duration);
    const calories = calculateCalories(dist, settings.weight);
    const achievedKm = dist / 1000;
    const targetKmNum = parseFloat(targetKm || '0');
    const targetMin = parseFloat(targetMinutes || '0');
    const challengeMet = targetKmNum > 0 && achievedKm >= targetKmNum;

    return {
      duration,
      distance: dist,
      pace,
      calories,
      achievedKm,
      targetKm: targetKmNum,
      targetMinutes: targetMin,
      challengeMet,
    };
  };

  // Save run to context
  const saveRun = async (res) => {
    if (res.duration < 5) return;

    const splits = [];
    if (locationsRef.current.length > 1) {
      let splitDist = 0;
      let splitStartIdx = 0;
      for (let i = 1; i < locationsRef.current.length; i++) {
        const segDist = calculateDistance([
          locationsRef.current[i - 1],
          locationsRef.current[i],
        ]);
        splitDist += segDist;
        if (splitDist >= 1000) {
          const splitTime =
            (locationsRef.current[i].timestamp -
              locationsRef.current[splitStartIdx].timestamp) /
            1000;
          splits.push({ km: splits.length + 1, time: splitTime });
          splitDist = 0;
          splitStartIdx = i;
        }
      }
    }

    await addRun({
      mode: 'exam',
      targetKm: res.targetKm,
      targetMinutes: res.targetMinutes,
      challengeMet: res.challengeMet,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      duration: res.duration,
      distance: res.distance,
      pace: res.pace,
      calories: res.calories,
      locations: locationsRef.current,
      splits,
    });
  };

  // When target time runs out
  const handleTimeExpired = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopLocationTracking();
    dismissRunActiveNotification();

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      Vibration.vibrate(500);
    }

    const res = buildResult(Math.round(targetSeconds));
    await saveRun(res);
    setResult(res);
    setPhase('finished');
  };

  // Start the challenge
  const handleStart = async () => {
    const km = parseFloat(targetKm);
    const min = parseFloat(targetMinutes);

    if (!km || km <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target distance in km.');
      return;
    }
    if (!min || min <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target time in minutes.');
      return;
    }

    const ok = await startLocationTracking();
    if (!ok) return;

    startTimeRef.current = new Date().toISOString();
    locationsRef.current = [];
    distanceRef.current = 0;
    elapsedRef.current = 0;
    timeExpiredSavedRef.current = false;
    setLocations([]);
    setDistance(0);
    setElapsedSeconds(0);
    setResult(null);
    setPhase('running');
    showRunActiveNotification();
  };

  const handlePause = () => {
    setPhase('paused');
    stopLocationTracking();
  };

  const handleResume = async () => {
    const ok = await startLocationTracking();
    if (!ok) return;
    setPhase('running');
  };

  // Manual stop
  const handleStop = () => {
    Alert.alert('Finish Exam', 'Are you sure you want to stop this challenge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          stopLocationTracking();
          dismissRunActiveNotification();

          const res = buildResult();
          await saveRun(res);
          setResult(res);
          setPhase('finished');
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Exam', 'Are you sure you want to discard this challenge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          stopLocationTracking();
          dismissRunActiveNotification();
          if (timerRef.current) clearInterval(timerRef.current);
          router.back();
        },
      },
    ]);
  };

  const currentPace = calculatePace(distance, elapsedSeconds);

  // ─── SETUP PHASE ─────────────────────────────
  if (phase === 'setup') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.setupContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.examBadge}>
                <Text style={styles.examBadgeText}>Exam Mode</Text>
              </View>
            </View>

            <View style={styles.setupHeader}>
              <View style={styles.setupIconCircle}>
                <Ionicons name="trophy-outline" size={32} color={COLORS.secondary} />
              </View>
              <Text style={styles.setupTitle}>Target Challenge</Text>
              <Text style={styles.setupSubtitle}>
                Select a saved preset or enter your custom distance & time.
              </Text>
            </View>

            {/* SAVED PRESETS / 1-CLICK SELECT */}
            <View style={styles.presetsSection}>
              <View style={styles.presetsHeaderRow}>
                <Text style={styles.presetsSectionTitle}>Quick Presets</Text>
                <TouchableOpacity
                  style={styles.savePresetLink}
                  onPress={handleOpenSavePreset}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.savePresetLinkText}>Save Current</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScrollContent}
              >
                {presets.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  const reqPace = (p.minutes * 60 / (p.km * 1000)) * 1000;

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                      onPress={() => handleSelectPreset(p)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.presetCardTop}>
                        <Text style={[styles.presetCardName, isSelected && styles.presetCardNameSelected]} numberOfLines={1}>
                          {p.name}
                        </Text>
                        {!p.isDefault && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(p.id);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={[styles.presetCardSpecs, isSelected && styles.presetCardSpecsSelected]}>
                        {p.km} km • {p.minutes} min
                      </Text>
                      <View style={[styles.presetPaceBadge, isSelected && styles.presetPaceBadgeSelected]}>
                        <Text style={[styles.presetPaceText, isSelected && styles.presetPaceTextSelected]}>
                          {formatPace(reqPace, 'km')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Target KM Input */}
            <View style={styles.inputCard}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="flag-outline" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>Target Distance</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={targetKm}
                  onChangeText={(val) => {
                    setTargetKm(val);
                    setSelectedPresetId(null);
                  }}
                  placeholder="e.g. 5"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  underlineColorAndroid="transparent"
                  selectionColor={COLORS.secondary}
                />
                <Text style={styles.inputUnit}>km</Text>
              </View>
            </View>

            {/* Target Minutes Input */}
            <View style={styles.inputCard}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.accent} style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>Target Time</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={targetMinutes}
                  onChangeText={(val) => {
                    setTargetMinutes(val);
                    setSelectedPresetId(null);
                  }}
                  placeholder="e.g. 30"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  underlineColorAndroid="transparent"
                  selectionColor={COLORS.secondary}
                />
                <Text style={styles.inputUnit}>min</Text>
              </View>
            </View>

            {/* Required Pace Preview */}
            {requiredPace > 0 && (
              <View style={styles.pacePreview}>
                <Text style={styles.pacePreviewLabel}>Required Pace to Pass</Text>
                <Text style={styles.pacePreviewValue}>
                  {formatPace(requiredPace, unit)}
                </Text>
              </View>
            )}

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startChallengeBtn}
              onPress={handleStart}
              activeOpacity={0.88}
            >
              <Ionicons name="play" size={22} color={COLORS.surface} style={{ marginRight: 8 }} />
              <Text style={styles.startChallengeBtnText}>START CHALLENGE</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Save Preset Modal */}
        <Modal
          visible={isSaveModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSaveModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.saveModalCard}>
              <Text style={styles.saveModalTitle}>Save Challenge Preset</Text>
              <Text style={styles.saveModalSub}>
                Give this target ({targetKm} km in {targetMinutes} min) a memorable name:
              </Text>

              <TextInput
                style={styles.saveModalInput}
                value={newPresetName}
                onChangeText={setNewPresetName}
                placeholder="e.g. Morning 5K Pace Test"
                placeholderTextColor={COLORS.textLight}
                autoFocus
              />

              <View style={styles.saveModalButtons}>
                <TouchableOpacity
                  style={styles.saveModalCancelBtn}
                  onPress={() => setIsSaveModalVisible(false)}
                >
                  <Text style={styles.saveModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveModalConfirmBtn}
                  onPress={handleConfirmSavePreset}
                >
                  <Text style={styles.saveModalConfirmText}>Save Preset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─── FINISHED PHASE ──────────────────────────
  if (phase === 'finished' && result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.finishedContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Result Icon */}
          <View
            style={[
              styles.resultIconCircle,
              {
                backgroundColor: result.challengeMet
                  ? COLORS.primaryLight
                  : COLORS.secondaryLight,
              },
            ]}
          >
            <Ionicons
              name={result.challengeMet ? 'trophy' : 'medal-outline'}
              size={48}
              color={result.challengeMet ? COLORS.primary : COLORS.secondary}
            />
          </View>

          <Text style={styles.resultTitle}>
            {result.challengeMet ? 'Challenge Passed!' : 'Challenge Complete'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {result.challengeMet
              ? `Completed ${result.achievedKm.toFixed(2)} km within ${result.targetMinutes} minutes.`
              : `Recorded ${result.achievedKm.toFixed(2)} km. Keep training to hit the target!`}
          </Text>

          {/* Target vs Achieved Comparison */}
          <View style={styles.resultCompare}>
            <View style={styles.resultColumn}>
              <View style={styles.resultColHeader}>
                <Ionicons name="flag-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.resultColumnTitle}>Target</Text>
              </View>
              <Text style={styles.resultBigValue}>
                {result.targetKm.toFixed(1)} km
              </Text>
              <Text style={styles.resultSmallValue}>
                {result.targetMinutes} min
              </Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultColumn}>
              <View style={styles.resultColHeader}>
                <Ionicons
                  name={result.challengeMet ? 'checkmark-circle' : 'time-outline'}
                  size={16}
                  color={result.challengeMet ? COLORS.primary : COLORS.secondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.resultColumnTitle}>Achieved</Text>
              </View>
              <Text
                style={[
                  styles.resultBigValue,
                  { color: result.challengeMet ? COLORS.primary : COLORS.secondary },
                ]}
              >
                {result.achievedKm.toFixed(2)} km
              </Text>
              <Text style={styles.resultSmallValue}>
                {formatDuration(result.duration)}
              </Text>
            </View>
          </View>

          {/* Detailed Stats */}
          <View style={styles.resultStatsCard}>
            <View style={styles.resultStatRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Total Distance</Text>
                <Text style={styles.resultStatValue}>
                  {formatDistance(result.distance, unit)}
                </Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Total Duration</Text>
                <Text style={styles.resultStatValue}>
                  {formatDuration(result.duration)}
                </Text>
              </View>
            </View>
            <View style={styles.resultStatRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Average Pace</Text>
                <Text style={styles.resultStatValue}>
                  {formatPace(result.pace, unit)}
                </Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Estimated Calories</Text>
                <Text style={styles.resultStatValue}>
                  {Math.round(result.calories)} cal
                </Text>
              </View>
            </View>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
            activeOpacity={0.88}
          >
            <Text style={styles.doneBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── ACTIVE PHASE (running / paused) ─────────
  const progressPercent = targetMeters > 0
    ? Math.min(100, (distance / targetMeters) * 100)
    : 0;

  const currentCoord = locations.length > 0 ? locations[locations.length - 1] : initialCoords;
  const mapRegion = currentCoord
    ? {
        latitude: currentCoord.latitude,
        longitude: currentCoord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleDiscard}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
            <Text style={styles.closeText}>Discard</Text>
          </TouchableOpacity>
          <View style={styles.challengeBadge}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.secondaryDark} style={{ marginRight: 4 }} />
            <Text style={styles.challengeBadgeText}>
              {parseFloat(targetKm || '0').toFixed(1)} km in {parseFloat(targetMinutes || '0')} min
            </Text>
          </View>
        </View>

        {/* Live Visual Path Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMapContainer}>
              {React.createElement('iframe', {
                title: 'Live Run Map',
                style: { border: 0, width: '100%', height: '100%', borderRadius: 16 },
                src: `https://www.openstreetmap.org/export/embed.html?bbox=${(currentCoord?.longitude || -122.4324) - 0.01}%2C${(currentCoord?.latitude || 37.78825) - 0.01}%2C${(currentCoord?.longitude || -122.4324) + 0.01}%2C${(currentCoord?.latitude || 37.78825) + 0.01}&layer=mapnik&marker=${currentCoord?.latitude || 37.78825}%2C${currentCoord?.longitude || -122.4324}`,
              })}
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              loadingEnabled={true}
              loadingIndicatorColor={COLORS.secondary}
              loadingBackgroundColor="#F1F5F9"
            >
              {locations.length > 0 && (
                <Polyline
                  coordinates={locations}
                  strokeColor="#FF3B30"
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {currentCoord && (
                <Marker
                  coordinate={{
                    latitude: currentCoord.latitude,
                    longitude: currentCoord.longitude,
                  }}
                  title="Your Location"
                  anchor={{ x: 0.5, y: 0.5 }}
                  flat={true}
                >
                  <View style={styles.runnerMarkerDot}>
                    <View style={styles.runnerMarkerInner} />
                  </View>
                </Marker>
              )}
            </MapView>
          )}
          <View style={styles.mapStatusBadge}>
            <View style={[styles.pulseDot, phase === 'running' && styles.pulseDotActive]} />
            <Text style={styles.mapStatusText}>
              {phase === 'running'
                ? `LIVE GPS • ${locations.length} PTS`
                : phase === 'paused'
                ? 'PAUSED'
                : 'GPS READY'}
            </Text>
          </View>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.statsHeroRow}>
            {/* Countdown Timer */}
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Time Remaining</Text>
              <Text
                style={[
                  styles.countdownValue,
                  remainingSeconds <= 60 && remainingSeconds > 0 && { color: COLORS.error },
                ]}
              >
                {formatDuration(remainingSeconds)}
              </Text>
              <Text style={styles.elapsedText}>
                Elapsed: {formatDuration(elapsedSeconds)}
              </Text>
            </View>

            {/* Distance with progress */}
            <View style={styles.distanceBlockContainer}>
              <View style={styles.distanceBlock}>
                <Text style={styles.distanceValue}>
                  {formatDistanceValue(distance, 'km')}
                </Text>
                <Text style={styles.distanceOf}>
                  / {parseFloat(targetKm || '0').toFixed(1)} km
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: progressPercent >= 100 ? COLORS.primary : COLORS.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{progressPercent.toFixed(0)}% completed</Text>
            </View>
          </View>

          {/* Pace Row */}
          <View style={styles.paceRow}>
            <View style={styles.paceItem}>
              <Text style={styles.paceItemLabel}>Current Pace</Text>
              <Text style={styles.paceItemValue}>{formatPace(currentPace, unit)}</Text>
            </View>
            <View style={styles.paceDivider} />
            <View style={styles.paceItem}>
              <Text style={styles.paceItemLabel}>Required Pace</Text>
              <Text style={styles.paceItemValue}>{formatPace(requiredPace, unit)}</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {phase === 'running' && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.85}>
                <Ionicons name="pause" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.pauseBtnText}>PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.85}>
                <Ionicons name="stop" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.stopBtnText}>STOP</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'paused' && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResume} activeOpacity={0.85}>
                <Ionicons name="play" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.resumeBtnText}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.85}>
                <Ionicons name="stop" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.stopBtnText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  examBadge: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  examBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondaryDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  challengeBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondaryDark,
    fontWeight: '700',
  },

  // Setup Phase
  setupContent: { paddingBottom: SPACING.xxl },
  setupHeader: { alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg },
  setupIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  setupTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  setupSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center', lineHeight: 18 },

  // Presets
  presetsSection: {
    marginBottom: SPACING.md,
  },
  presetsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  presetsSectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savePresetLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savePresetLinkText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  presetsScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  presetCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  presetCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: '#FFFBEB',
  },
  presetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  presetCardName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  presetCardNameSelected: {
    color: COLORS.secondaryDark,
  },
  presetCardSpecs: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  presetCardSpecsSelected: {
    color: COLORS.secondaryDark,
  },
  presetPaceBadge: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  presetPaceBadgeSelected: {
    backgroundColor: '#FEF3C7',
  },
  presetPaceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetPaceTextSelected: {
    color: COLORS.secondaryDark,
    fontWeight: '700',
  },

  // Input Card
  inputCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
    paddingVertical: 4,
  },
  inputUnit: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '700', marginLeft: SPACING.sm },
  pacePreview: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  pacePreviewLabel: { fontSize: FONT_SIZES.xs, color: COLORS.primaryDark, fontWeight: '700', textTransform: 'uppercase' },
  pacePreviewValue: { fontSize: FONT_SIZES.xxl, color: COLORS.primaryDark, fontWeight: '800', marginTop: SPACING.xs },
  startChallengeBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startChallengeBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.lg, fontWeight: '800', letterSpacing: 1 },

  // Save Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  saveModalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  saveModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  saveModalSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  saveModalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  saveModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  saveModalCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  saveModalCancelText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveModalConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  saveModalConfirmText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.surface,
  },

  // Live Map Styles
  mapContainer: {
    flex: 1,
    minHeight: 200,
    maxHeight: '44%',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  runnerMarkerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  runnerMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
  },
  mapStatusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  pulseDotActive: {
    backgroundColor: '#22C55E',
  },
  mapStatusText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Active Phase
  mainStats: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  statsHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: SPACING.xs,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  elapsedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  distanceBlockContainer: {
    alignItems: 'center',
    width: '45%',
  },
  distanceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  distanceOf: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  paceRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
    marginTop: SPACING.xs,
  },
  paceItem: {
    alignItems: 'center',
    flex: 1,
  },
  paceItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  paceItemValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  paceDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },

  // Controls
  controls: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.md, fontWeight: '800', letterSpacing: 1 },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.md, fontWeight: '800', letterSpacing: 1 },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.md, fontWeight: '800', letterSpacing: 1 },

  // Finished Phase
  finishedContent: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.md },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  resultTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  resultSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.lg,
    lineHeight: 20,
  },
  resultCompare: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
  },
  resultColumn: { flex: 1, alignItems: 'center' },
  resultColHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  resultColumnTitle: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  resultBigValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text },
  resultSmallValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  resultDivider: { width: 1, backgroundColor: COLORS.border },
  resultStatsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
  },
  resultStatRow: { flexDirection: 'row', marginBottom: SPACING.md },
  resultStat: { flex: 1, alignItems: 'center' },
  resultStatLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  resultStatValue: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.lg,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.md, fontWeight: '800', letterSpacing: 0.5 },
});
