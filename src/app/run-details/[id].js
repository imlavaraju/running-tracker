/**
 * Run Details Screen — Full breakdown of a single run
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  formatDistance, formatDuration, formatPace, formatDate, formatTime, formatCalories,
} from '../../utils/formatters';

export default function RunDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { getRun, deleteRun } = useRuns();
  const { settings } = useSettings();
  const unit = settings.unit;
  const run = getRun(id);

  if (!run) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Run not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Run', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRun(run.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Stats */}
      <View style={styles.hero}>
        <Text style={styles.heroDate}>{formatDate(run.startTime)}</Text>
        <Text style={styles.heroTime}>{formatTime(run.startTime)}</Text>
        <Text style={styles.heroDistance}>{formatDistance(run.distance, unit)}</Text>
      </View>

      {/* Stat Grid */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <DetailStat label="Duration" value={formatDuration(run.duration)} icon="⏱️" />
          <DetailStat label="Pace" value={formatPace(run.pace, unit)} icon="⚡" />
        </View>
        <View style={styles.statRow}>
          <DetailStat label="Calories" value={formatCalories(run.calories)} icon="🔥" />
          <DetailStat
            label="Locations"
            value={`${run.locations ? run.locations.length : 0} pts`}
            icon="📍"
          />
        </View>
      </View>

      {/* Splits */}
      {run.splits && run.splits.length > 0 && (
        <View style={styles.splitsCard}>
          <Text style={styles.sectionTitle}>Splits</Text>
          {run.splits.map((split, i) => (
            <View key={i} style={styles.splitRow}>
              <Text style={styles.splitKm}>
                {unit === 'mi' ? `Mile ${split.km}` : `Km ${split.km}`}
              </Text>
              <Text style={styles.splitTime}>{formatDuration(split.time)}</Text>
              <Text style={styles.splitPace}>
                {formatPace(split.time, unit)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete Run</Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

function DetailStat({ label, value, icon }) {
  return (
    <View style={styles.detailStat}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  hero: {
    backgroundColor: COLORS.primary, padding: SPACING.xl,
    alignItems: 'center', paddingTop: SPACING.lg,
  },
  heroDate: { fontSize: FONT_SIZES.lg, color: COLORS.surface, opacity: 0.85 },
  heroTime: { fontSize: FONT_SIZES.md, color: COLORS.surface, opacity: 0.7, marginTop: 2 },
  heroDistance: { fontSize: 56, fontWeight: '700', color: COLORS.surface, marginTop: SPACING.sm },
  statsCard: {
    backgroundColor: COLORS.surface, margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  detailStat: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  detailIcon: { fontSize: 20, marginBottom: 4 },
  detailValue: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  detailLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  splitsCard: {
    backgroundColor: COLORS.surface, marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm,
  },
  splitRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  splitKm: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '500', flex: 1 },
  splitTime: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, flex: 1, textAlign: 'center' },
  splitPace: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '600', flex: 1, textAlign: 'right' },
  deleteBtn: {
    marginHorizontal: SPACING.md, marginTop: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.error, fontSize: FONT_SIZES.lg, fontWeight: '600' },
});

