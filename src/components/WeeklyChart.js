import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { formatDistanceValue } from '../utils/formatters';

const BAR_TRACK_HEIGHT = 100;

export default function WeeklyChart({ data = [], unit = 'km', goal }) {
  const maxDistance = Math.max(...data.map((d) => d.distance), goal || 0, 1);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <Text style={styles.chartHeaderTitle}>Daily Distance</Text>
        <Text style={styles.chartHeaderUnit}>({unit})</Text>
      </View>

      {/* Plot Area: Values + Bars */}
      <View style={styles.plotArea}>
        {data.map((item, index) => {
          const d = new Date(item.date);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const isToday = dateKey === todayKey;
          const barHeight = maxDistance > 0
            ? Math.max(
                (item.distance / maxDistance) * BAR_TRACK_HEIGHT,
                item.distance > 0 ? 6 : 0
              )
            : 0;

          return (
            <View key={index} style={styles.column}>
              {/* Value label above bar */}
              <View style={styles.valueContainer}>
                <Text
                  style={[
                    styles.barValue,
                    isToday && styles.barValueToday,
                  ]}
                  numberOfLines={1}
                >
                  {item.distance > 0 ? formatDistanceValue(item.distance, unit) : ''}
                </Text>
              </View>

              {/* Bar track with fill */}
              <View style={styles.track}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: isToday ? COLORS.primary : COLORS.accent,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Zero baseline marker */}
      <View style={styles.zeroLine} />

      {/* Day of Week Labels Row */}
      <View style={styles.daysRow}>
        {data.map((item, index) => {
          const d = new Date(item.date);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const isToday = dateKey === todayKey;

          return (
            <View key={index} style={styles.dayLabelCell}>
              <View style={[styles.dayLabelBadge, isToday && styles.dayLabelBadgeToday]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {item.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  chartHeaderTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartHeaderUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  plotArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: SPACING.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  valueContainer: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  barValueToday: {
    color: COLORS.primary,
  },
  track: {
    width: 22,
    height: BAR_TRACK_HEIGHT,
    backgroundColor: COLORS.background,
    borderRadius: 5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
  },
  zeroLine: {
    height: 1.5,
    backgroundColor: COLORS.border,
    width: '100%',
    marginTop: 0,
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabelBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  dayLabelBadgeToday: {
    backgroundColor: COLORS.primaryLight,
  },
  dayLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
});
