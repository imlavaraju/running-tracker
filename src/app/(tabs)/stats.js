/**
 * Stats Screen — Weekly/monthly statistics and trends
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          <Text style={styles.title}>Statistics</Text>
        </View>
        <EmptyState
          icon="📊"
          title="No stats yet"
          message="Complete some runs to see your statistics and trends."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          {['week', 'month'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="📏" title="Distance" value={formatDistance(stats.totalDistance, unit)} color={COLORS.primary} />
          <StatCard icon="⏱️" title="Time" value={formatDuration(stats.totalDuration)} color={COLORS.accent} />
          <StatCard icon="🏃" title="Runs" value={String(stats.runCount)} color={COLORS.secondary} />
          <StatCard icon="⚡" title="Avg Pace" value={stats.avgPace > 0 ? formatPace(stats.avgPace, unit) : '--'} color={COLORS.primaryDark} />
        </View>

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <WeeklyChart data={dailyData} unit={unit} />

        {/* All-Time Records */}
        <Text style={styles.sectionTitle}>All-Time Records</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="🏆" title="Total Distance" value={formatDistance(totalDistance, unit)} color={COLORS.primary} />
          <StatCard icon="🔥" title="Total Runs" value={String(totalRuns)} color={COLORS.secondary} />
          <StatCard icon="🥇" title="Longest Run" value={formatDistance(longestRun, unit)} color={COLORS.accent} />
          <StatCard icon="⚡" title="Best Pace" value={fastestPace > 0 ? formatPace(fastestPace, unit) : '--'} color={COLORS.primaryDark} />
          <StatCard icon="📅" title="Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} color={COLORS.secondaryDark} />
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  toggleContainer: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleBtnActive: { backgroundColor: COLORS.surface },
  toggleText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: COLORS.primary, fontWeight: '700' },
  sectionTitle: {
    fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, marginBottom: SPACING.sm,
  },
});

