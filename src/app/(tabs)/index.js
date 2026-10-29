/**
 * Home / Dashboard Screen
 * Featuring a Central Hero Start Station with dynamic background running icons
 * and seamless 1-tap mode switching (Free Run vs. Exam Mode).
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLocation } from '../../contexts/LocationContext';
import { getWeeklyStats, getDailyDistances, getCurrentStreak } from '../../utils/calculations';
import { formatDistance, formatDuration } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import WeeklyChart from '../../components/WeeklyChart';
import RunCard from '../../components/RunCard';
import EmptyState from '../../components/EmptyState';
import GpsIndicator from '../../components/GpsIndicator';

export default function HomeScreen() {
  const { runs, isLoading } = useRuns();
  const { settings } = useSettings();
  const {
    isReady: isLocationReady,
    isChecking: isLocationChecking,
    servicesEnabled,
    permissionStatus,
    checkLocationStatus,
    requestPermission,
  } = useLocation();
  const [selectedMode, setSelectedMode] = useState('free'); // 'free' | 'exam'
  const unit = settings.unit;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const weekly = getWeeklyStats(runs);
  const dailyData = getDailyDistances(runs, 7);
  const streak = getCurrentStreak(runs);
  const recentRuns = runs.slice(0, 3);

  const handleLaunchRun = () => {
    if (!servicesEnabled) {
      Alert.alert(
        'Location Is Turned Off',
        'GPS and device location service must be turned on to track your run. Please enable it in device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Turn On', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Running Tracker needs location permission to track your distance, pace, and path.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: () => requestPermission() },
        ]
      );
      return;
    }

    if (selectedMode === 'free') {
      router.push('/run');
    } else {
      router.push('/running-test');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Aligned to padding grid */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>Running Tracker</Text>
            <Text style={styles.subtitle}>Fitness & Performance Tracking</Text>
          </View>
          <View style={styles.headerRightActions}>
            <GpsIndicator />
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats Overview */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="speedometer-outline"
            title="Distance"
            value={formatDistance(weekly.totalDistance, unit)}
            color={COLORS.primary}
          />
          <StatCard
            icon="time-outline"
            title="Time"
            value={formatDuration(weekly.totalDuration)}
            color={COLORS.accent}
          />
          <StatCard
            icon="flame-outline"
            title="Runs"
            value={String(weekly.runCount)}
            color={COLORS.secondary}
          />
          <StatCard
            icon="flash-outline"
            title="Streak"
            value={`${streak} day${streak !== 1 ? 's' : ''}`}
            color={COLORS.secondaryDark}
          />
        </View>

        {/* CENTER HERO START STATION */}
        <View style={styles.heroStationCard}>
          {/* Location Verification & Dynamic Start Station */}
          {isLocationChecking ? (
            <View style={styles.locationCheckingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.locationCheckingText}>Checking location status...</Text>
            </View>
          ) : !isLocationReady ? (
            <View style={styles.locationBlockedContainer}>
              <View style={styles.locationBlockedIconCircle}>
                <Ionicons
                  name={!servicesEnabled ? 'location-outline' : 'hand-left-outline'}
                  size={36}
                  color={COLORS.error}
                />
              </View>
              <Text style={styles.locationBlockedTitle}>
                {!servicesEnabled ? 'Location Is Turned Off' : 'Location Permission Required'}
              </Text>
              <Text style={styles.locationBlockedMessage}>
                {!servicesEnabled
                  ? 'Device location is turned off. GPS is required to track your run. Turn on location services to enable run options.'
                  : 'Running Tracker needs location permission to track your workouts. Grant permission to enable run options.'}
              </Text>
              <View style={styles.locationBlockedActions}>
                <TouchableOpacity
                  style={styles.locationEnableBtn}
                  onPress={() => {
                    if (!servicesEnabled) {
                      Linking.openSettings();
                    } else {
                      requestPermission();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={18} color={COLORS.surface} style={{ marginRight: 6 }} />
                  <Text style={styles.locationEnableBtnText}>
                    {!servicesEnabled ? 'Turn On Location' : 'Grant Permission'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.locationRefreshBtn}
                  onPress={checkLocationStatus}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.locationRefreshBtnText}>Check Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Mode Selector Pill at Top of Station */}
              <View style={styles.modeToggleBar}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleBtn,
                    selectedMode === 'free' && styles.modeToggleBtnActiveFree,
                  ]}
                  onPress={() => setSelectedMode('free')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="fitness-outline"
                    size={16}
                    color={selectedMode === 'free' ? COLORS.surface : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      selectedMode === 'free' && styles.modeToggleTextActive,
                    ]}
                  >
                    Free Run
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeToggleBtn,
                    selectedMode === 'exam' && styles.modeToggleBtnActiveExam,
                  ]}
                  onPress={() => setSelectedMode('exam')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trophy-outline"
                    size={16}
                    color={selectedMode === 'exam' ? COLORS.surface : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      selectedMode === 'exam' && styles.modeToggleTextActive,
                    ]}
                  >
                    Exam Mode
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Middle Circular Start Button with Pulse Rings */}
              <View style={styles.centerButtonContainer}>
                <View
                  style={[
                    styles.outerPulseRing,
                    {
                      borderColor:
                        selectedMode === 'free'
                          ? COLORS.primaryLight
                          : COLORS.secondaryLight,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.centerStartBtn,
                      {
                        backgroundColor:
                          selectedMode === 'free'
                            ? COLORS.primary
                            : COLORS.secondary,
                        shadowColor:
                          selectedMode === 'free'
                            ? COLORS.primary
                            : COLORS.secondary,
                      },
                    ]}
                    onPress={handleLaunchRun}
                    activeOpacity={0.88}
                    accessibilityLabel="Start Running Workout"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="play"
                      size={36}
                      color={COLORS.surface}
                      style={styles.centerPlayIcon}
                    />
                    <Text style={styles.centerStartText}>START</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Mode Subtitle & Target Info */}
              <View style={styles.stationFooter}>
                <Text style={styles.stationModeTitle}>
                  {selectedMode === 'free'
                    ? 'Open Tracking Session'
                    : 'Target Distance & Time Challenge'}
                </Text>
                <Text style={styles.stationModeSub}>
                  {selectedMode === 'free'
                    ? 'Live GPS • Pace • Calories • Route'
                    : 'Pacing Evaluation • Countdown • Saved Presets'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Daily Distance Chart */}
        <WeeklyChart data={dailyData} unit={unit} />

        {/* Recent Runs Header & List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          {runs.length > 3 && (
            <TouchableOpacity
              onPress={() => router.push('/history')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentRuns.length > 0 ? (
          recentRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              unit={unit}
              onPress={() => router.push(`/run-details/${run.id}`)}
            />
          ))
        ) : (
          <EmptyState
            icon="fitness-outline"
            title="No runs yet"
            message="Tap START above to record your first workout and build your streak."
          />
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },

  // Header aligned to 16px grid
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Weekly Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // HERO CENTER START STATION WITH BACKGROUND RUNNING ICONS
  heroStationCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },

  // Mode Toggle Segmented Control
  modeToggleBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
  },
  modeToggleBtnActiveFree: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleBtnActiveExam: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  modeToggleTextActive: {
    color: COLORS.surface,
  },

  // Centered Hero Button with Pulse Ring
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  outerPulseRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  centerStartBtn: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  centerPlayIcon: {
    marginLeft: 4, // Optical centering for play triangle
  },
  centerStartText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xs,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },

  // Station Footer Info
  stationFooter: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  stationModeTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  stationModeSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 3,
  },

  // Section Headers & Titles
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SPACING.md,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Location Verification Blocked State
  locationCheckingContainer: {
    paddingVertical: SPACING.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCheckingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  locationBlockedContainer: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBlockedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationBlockedTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  locationBlockedMessage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
    maxWidth: 290,
  },
  locationBlockedActions: {
    alignItems: 'center',
    width: '100%',
  },
  locationEnableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: SPACING.xs,
  },
  locationEnableBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  locationRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  locationRefreshBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
