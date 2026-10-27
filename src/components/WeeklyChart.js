import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { formatDistanceValue } from '../utils/formatters';

const CHART_HEIGHT = 120;

export default function WeeklyChart({ data = [], unit = 'km', goal }) {
  const maxDistance = Math.max(...data.map((d) => d.distance), goal || 0, 1);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const d = new Date(item.date);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const isToday = dateKey === todayKey;
          const barHeight = maxDistance > 0
            ? Math.max((item.distance / maxDistance) * CHART_HEIGHT, item.distance > 0 ? 4 : 0)
            : 0;

          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {item.distance > 0 ? formatDistanceValue(item.distance, unit) : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight, backgroundColor: isToday ? COLORS.primary : COLORS.primaryLight },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                {item.label}
              </Text>
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
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 40,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4, height: 14 },
  barTrack: { width: '60%', height: CHART_HEIGHT, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4, minWidth: 8 },
  dayLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: 6, fontWeight: '500' },
  dayLabelActive: { color: COLORS.primary, fontWeight: '700' },
});

