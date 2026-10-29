/**
 * Stats Screen — Weekly/monthly statistics and trends
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  getWeeklyStats, getMonthlyStats, getDailyDistances, getCurrentStreak,
} from '../../utils/calculations';
import { formatDistance, formatDuration, formatPace } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import WeeklyChart from '../../components/WeeklyChart';
import EmptyState from '../../components/EmptyState';
import GpsIndicator from '../../components/GpsIndicator';

export default function StatsScreen() {
  const { runs } = useRuns();
  const { settings } = useSettings();
  const [period, setPeriod] = useState('week');
  const unit = settings.unit;

  const weekly = getWeeklyStats(runs);
  const monthly = getMonthlyStats(runs);
  const stats = period === 'week' ? weekly : monthly;
  const dailyData = getDailyDistances(runs, 7);
  const streak = getCurrentStreak(runs);

  // All-time stats
  const totalDistance = runs.reduce((s, r) => s + (r.distance || 0), 0);
  const totalRuns = runs.length;
  const longestRun = runs.reduce((max, r) => Math.max(max, r.distance || 0), 0);
  const fastestPace = runs.reduce((min, r) => {
    if (!r.pace || r.pace <= 0) return min;
    return min === 0 ? r.pace : Math.min(min, r.pace);
  }, 0);

  if (runs.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Statistics</Text>
            <Text style={styles.subtitle}>Performance & Records</Text>
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
        <EmptyState
          icon="stats-chart-outline"
          title="No stats yet"
          message="Complete some runs to see your statistics and trends."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Statistics</Text>
            <Text style={styles.subtitle}>Performance & Records</Text>
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

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          {['week', 'month'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="speedometer-outline"
            title="Distance"
            value={formatDistance(stats.totalDistance, unit)}
            color={COLORS.primary}
          />
          <StatCard
            icon="time-outline"
            title="Time"
            value={formatDuration(stats.totalDuration)}
            color={COLORS.accent}
          />
          <StatCard
            icon="flame-outline"
            title="Runs"
            value={String(stats.runCount)}
            color={COLORS.secondary}
          />
          <StatCard
            icon="flash-outline"
            title="Avg Pace"
            value={stats.avgPace > 0 ? formatPace(stats.avgPace, unit) : '--'}
            color={COLORS.secondaryDark}
          />
        </View>

        {/* Weekly Chart */}
        <WeeklyChart data={dailyData} unit={unit} />

        {/* All-Time Records */}
        <Text style={styles.sectionTitle}>All-Time Records</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="trophy-outline"
            title="Total Distance"
            value={formatDistance(totalDistance, unit)}
            color={COLORS.primary}
          />
          <StatCard
            icon="fitness-outline"
            title="Total Runs"
            value={String(totalRuns)}
            color={COLORS.secondary}
          />
          <StatCard
            icon="medal-outline"
            title="Longest Run"
            value={formatDistance(longestRun, unit)}
            color={COLORS.accent}
          />
          <StatCard
            icon="flash-outline"
            title="Best Pace"
            value={fastestPace > 0 ? formatPace(fastestPace, unit) : '--'}
            color={COLORS.primaryDark}
          />
          <StatCard
            icon="calendar-outline"
            title="Streak"
            value={`${streak} day${streak !== 1 ? 's' : ''}`}
            color={COLORS.secondaryDark}
          />
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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
  title: {
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
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
});
