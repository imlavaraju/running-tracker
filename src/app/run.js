/**
 * Active Run Screen — GPS tracking with timer, distance, pace
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useRuns } from '../contexts/RunContext';
import { useSettings } from '../contexts/SettingsContext';
import { calculateDistance, calculatePace, calculateCalories } from '../utils/calculations';
import { formatDistance, formatPace } from '../utils/formatters';
import Timer from '../components/Timer';

const LOCATION_INTERVAL = 3000; // ms
const LOCATION_DISTANCE = 5; // meters

export default function RunScreen() {
  const { addRun } = useRuns();
  const { settings } = useSettings();
  const unit = settings.unit;

  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [seconds, setSeconds] = useState(0);
  const [locations, setLocations] = useState([]);
  const [distance, setDistance] = useState(0);

  const timerRef = useRef(null);
  const locationSub = useRef(null);
  const startTimeRef = useRef(null);
  const locationsRef = useRef([]);

  // Timer
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Location tracking
  const startLocationTracking = useCallback(async () => {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to track your run. You can still use the timer.',
      );
      return;
    }

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: LOCATION_INTERVAL,
        distanceInterval: LOCATION_DISTANCE,
      },
      (loc) => {
        const point = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        };
        locationsRef.current = [...locationsRef.current, point];
        setLocations((prev) => [...prev, point]);
        setDistance(calculateDistance(locationsRef.current));
      },
    );
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopLocationTracking]);

  // Actions
  const handleStart = async () => {
    startTimeRef.current = new Date().toISOString();
    locationsRef.current = [];
    setLocations([]);
    setDistance(0);
    setSeconds(0);
    setStatus('running');
    await startLocationTracking();
  };

  const handlePause = () => {
    setStatus('paused');
    stopLocationTracking();
  };

  const handleResume = async () => {
    setStatus('running');
    await startLocationTracking();
  };

  const handleStop = () => {
    Alert.alert('Finish Run', 'Are you sure you want to finish this run?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: async () => {
          setStatus('idle');
          stopLocationTracking();

          if (seconds < 5) {
            router.back();
            return;
          }

          const pace = calculatePace(distance, seconds);
          const calories = calculateCalories(distance, settings.weight);

          // Calculate 1km splits
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
            startTime: startTimeRef.current,
            endTime: new Date().toISOString(),
            duration: seconds,
            distance,
            pace,
            calories,
            locations: locationsRef.current,
            splits,
          });

          router.back();
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Run', 'Are you sure you want to discard this run?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setStatus('idle');
          stopLocationTracking();
          router.back();
        },
      },
    ]);
  };

  const pace = calculatePace(distance, seconds);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Close / Discard */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={status === 'idle' ? () => router.back() : handleDiscard}>
            <Text style={styles.closeText}>{status === 'idle' ? '✕ Close' : '✕ Discard'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <Timer seconds={seconds} isRunning={status === 'running'} />

          <View style={styles.distanceContainer}>
            <Text style={styles.distanceValue}>{formatDistance(distance, unit)}</Text>
            <Text style={styles.distanceLabel}>Distance</Text>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryValue}>{formatPace(pace, unit)}</Text>
              <Text style={styles.secondaryLabel}>Pace</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryValue}>
                {Math.round(calculateCalories(distance, settings.weight))}
              </Text>
              <Text style={styles.secondaryLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {status === 'idle' && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>START</Text>
            </TouchableOpacity>
          )}

          {status === 'running' && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
                <Text style={styles.pauseBtnText}>⏸ PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                <Text style={styles.stopBtnText}>⏹ STOP</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'paused' && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
                <Text style={styles.resumeBtnText}>▶ RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                <Text style={styles.stopBtnText}>⏹ FINISH</Text>
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
  container: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', justifyContent: 'flex-start',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
  },
  closeText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '500' },
  mainStats: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  distanceContainer: { alignItems: 'center', marginTop: SPACING.xl },
  distanceValue: { fontSize: 56, fontWeight: '700', color: COLORS.primary },
  distanceLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  secondaryStats: {
    flexDirection: 'row', marginTop: SPACING.xl,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  secondaryStat: { alignItems: 'center', paddingHorizontal: SPACING.lg },
  secondaryValue: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  secondaryLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  statSeparator: { width: 1, backgroundColor: COLORS.border },
  controls: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  startBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.xxl, fontWeight: '700', letterSpacing: 3 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  pauseBtn: {
    flex: 1, backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg, alignItems: 'center',
  },
  pauseBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  resumeBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg, alignItems: 'center',
  },
  resumeBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  stopBtn: {
    flex: 1, backgroundColor: COLORS.error, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg, alignItems: 'center',
  },
  stopBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});

