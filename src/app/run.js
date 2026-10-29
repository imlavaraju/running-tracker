/**
 * Active Run Screen — GPS tracking with timer, distance, pace
 * Unified vector iconography and high-contrast UI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useRuns } from '../contexts/RunContext';
import { useSettings } from '../contexts/SettingsContext';
import { calculateDistance, calculatePace, calculateCalories } from '../utils/calculations';
import { formatDistance, formatPace, formatMetric } from '../utils/formatters';
import { showRunActiveNotification, dismissRunActiveNotification } from '../utils/notifications';
import {
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  activeTripCache,
  processRawCoordinate,
} from '../utils/backgroundLocation';
import Timer from '../components/Timer';

const LOCATION_INTERVAL = 3000; // ms
const LOCATION_DISTANCE = 5; // meters
const MAX_ACCURACY = 25; // meters — ponytail: tune if rural/open-sky runs drop too many points
const MIN_MOVE = 3; // meters — ignore jitter below this
const MAX_SPEED = 12; // m/s (~43 km/h) — anything faster is a glitch

export default function RunScreen() {
  const { addRun } = useRuns();
  const { settings } = useSettings();
  const unit = settings.unit;

  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [seconds, setSeconds] = useState(0);
  const [locations, setLocations] = useState([]);
  const [distance, setDistance] = useState(0);
  const [initialCoords, setInitialCoords] = useState(null);

  const timerRef = useRef(null);
  const locationSub = useRef(null);
  const startTimeRef = useRef(null);
  const locationsRef = useRef([]);
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

  // Subscribe to background & foreground filtered location updates
  useEffect(() => {
    const unsubscribe = activeTripCache.subscribe((newPoint, allPoints) => {
      locationsRef.current = allPoints;
      setLocations([...allPoints]);
      setDistance(calculateDistance(allPoints));
    });
    return () => unsubscribe();
  }, []);

  // Timer — Uses wall-clock delta to prevent drift when app is swapped or backgrounded
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - new Date(startTimeRef.current).getTime()) / 1000
          );
          setSeconds(elapsed);
        } else {
          setSeconds((s) => s + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Location tracking via Foreground Service + In-App Fallback
  const startLocationTracking = useCallback(async () => {
    const hasServices = await Location.hasServicesEnabledAsync();
    if (!hasServices) {
      Alert.alert(
        'Location Is Turned Off',
        'Device location service is required to track your run. Please enable it in device settings.',
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
        'Running Tracker requires location permission to track your distance and pace.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    // Attempt starting Foreground Service for continuous background tracking
    try {
      const bgStarted = await startForegroundLocationTracking();
      if (bgStarted) {
        return true;
      }
    } catch (err) {
      // Fall through to watchPositionAsync
    }

    // Foreground fallback (e.g. for web or when task manager cannot bind)
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

  // Actions
  const handleStart = async () => {
    const ok = await startLocationTracking();
    if (!ok) return;

    startTimeRef.current = new Date().toISOString();
    locationsRef.current = [];
    setLocations([]);
    setDistance(0);
    setSeconds(0);
    setStatus('running');
    showRunActiveNotification();
  };

  const handlePause = () => {
    setStatus('paused');
    stopLocationTracking();
  };

  const handleResume = async () => {
    const ok = await startLocationTracking();
    if (!ok) return;
    setStatus('running');
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
          dismissRunActiveNotification();

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
            mode: 'free',
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
          dismissRunActiveNotification();
          router.back();
        },
      },
    ]);
  };

  const pace = calculatePace(distance, seconds);

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
        {/* Close / Discard Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={status === 'idle' ? () => router.back() : handleDiscard}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
            <Text style={styles.closeText}>
              {status === 'idle' ? 'Close' : 'Discard'}
            </Text>
          </TouchableOpacity>

          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>Free Run</Text>
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
              loadingIndicatorColor={COLORS.primary}
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
            <View style={[styles.pulseDot, status === 'running' && styles.pulseDotActive]} />
            <Text style={styles.mapStatusText}>
              {status === 'running'
                ? `LIVE GPS • ${locations.length} PTS`
                : status === 'paused'
                ? 'PAUSED'
                : 'GPS READY'}
            </Text>
          </View>
        </View>

        {/* Metrics Section */}
        <View style={styles.mainStats}>
          <View style={styles.statsHeroRow}>
            <Timer seconds={seconds} isRunning={status === 'running'} />
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceValue}>{formatDistance(distance, unit)}</Text>
              <Text style={styles.distanceLabel}>Distance</Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryValue}>
                {formatMetric(pace, unit, settings.metricDisplay)}
              </Text>
              <Text style={styles.secondaryLabel}>
                {settings.metricDisplay === 'speed' ? 'Speed' : 'Pace'}
              </Text>
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
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.88}>
              <Ionicons name="play" size={24} color={COLORS.surface} style={{ marginRight: SPACING.sm }} />
              <Text style={styles.startBtnText}>START RUN</Text>
            </TouchableOpacity>
          )}

          {status === 'running' && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.85}>
                <Ionicons name="pause" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.pauseBtnText}>PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.85}>
                <Ionicons name="stop" size={22} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.stopBtnText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'paused' && (
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
  container: { flex: 1, justifyContent: 'space-between' },
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
  modeTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  modeTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Live Map Styles
  mapContainer: {
    flex: 1,
    minHeight: 220,
    maxHeight: '48%',
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
    backgroundColor: 'rgba(0, 230, 118, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00E676',
  },
  runnerMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
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

  // Metrics Section
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
  distanceContainer: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  distanceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  secondaryStats: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
    justifyContent: 'space-around',
  },
  secondaryStat: { alignItems: 'center', paddingHorizontal: SPACING.md },
  secondaryValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  secondaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statSeparator: { width: 1, backgroundColor: COLORS.border },
  controls: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    letterSpacing: 2,
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
});
