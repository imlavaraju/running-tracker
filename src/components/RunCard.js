import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { formatDistance, formatDuration, formatPace, getRelativeDate, formatTime } from '../utils/formatters';

export default function RunCard({ run, unit = 'km', onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🏃</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{getRelativeDate(run.startTime)}</Text>
          <Text style={styles.time}>{formatTime(run.startTime)}</Text>
        </View>
        <Text style={styles.distance}>{formatDistance(run.distance, unit)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(run.duration)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>{formatPace(run.pace, unit)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Cal</Text>
            <Text style={styles.statValue}>{Math.round(run.calories || 0)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  date: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  time: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
  distance: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, textTransform: 'uppercase' },
  statValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
  arrow: { fontSize: FONT_SIZES.xxl, color: COLORS.textLight, marginLeft: SPACING.sm },
});

