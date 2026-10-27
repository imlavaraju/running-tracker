/**
 * Home / Dashboard Screen
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getWeeklyStats, getDailyDistances, getCurrentStreak } from '../../utils/calculations';
import { formatDistance, formatDuration, formatPace } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import WeeklyChart from '../../components/WeeklyChart';
import RunCard from '../../components/RunCard';
import EmptyState from '../../components/EmptyState';

export default function HomeScreen() {
  const { runs, isLoading } = useRuns();
  const { settings } = useSettings();
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Running Tracker</Text>
            <Text style={styles.subtitle}>Let's get moving! 💪</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Start Run Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/run')}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonEmoji}>🏃</Text>
          <View>
            <Text style={styles.startButtonText}>Start Run</Text>
            <Text style={styles.startButtonSub}>Tap to begin tracking</Text>
          </View>
        </TouchableOpacity>

        {/* Weekly Stats */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="📏"
            title="Distance"
            value={formatDistance(weekly.totalDistance, unit)}
            color={COLORS.primary}
          />
          <StatCard
            icon="⏱️"
            title="Time"
            value={formatDuration(weekly.totalDuration)}
            color={COLORS.accent}
          />
          <StatCard
            icon="🔥"
            title="Runs"
            value={String(weekly.runCount)}
            color={COLORS.secondary}
          />
          <StatCard
            icon="⚡"
            title="Streak"
            value={`${streak} day${streak !== 1 ? 's' : ''}`}
            color={COLORS.secondaryDark}
          />
        </View>

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>Daily Distance</Text>
        <WeeklyChart data={dailyData} unit={unit} />

        {/* Recent Runs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          {runs.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/history')}>
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
            icon="👟"
            title="No runs yet"
            message="Start your first run and your activity will show up here."
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  greeting: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 2 },
  settingsBtn: { padding: SPACING.sm },
  settingsIcon: { fontSize: 24 },
  startButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  startButtonEmoji: { fontSize: 36, marginRight: SPACING.md },
  startButtonText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.surface },
  startButtonSub: { fontSize: FONT_SIZES.sm, color: COLORS.surface, opacity: 0.85, marginTop: 2 },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.md },
  seeAll: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
});

