import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { formatDistance, formatDuration, formatPace, formatMetric, getRelativeDate, formatTime } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';

export default function RunCard({ run, unit, onPress }) {
  const { settings } = useSettings();
  const currentUnit = unit || settings.unit;
  const isExam = run.mode === 'exam' || !!run.targetKm;
  const isPassed = isExam && run.challengeMet;
  const isSpeed = settings.metricDisplay === 'speed';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Dynamic Mode Icon Container */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isExam ? COLORS.secondaryLight : COLORS.primaryLight,
          },
        ]}
      >
        <Ionicons
          name={isExam ? (isPassed ? 'trophy' : 'medal-outline') : 'fitness-outline'}
          size={22}
          color={isExam ? COLORS.secondaryDark : COLORS.primary}
        />
      </View>

      <View style={styles.content}>
        {/* Top Row with Date and Mode Badge */}
        <View style={styles.topRow}>
          <View style={styles.dateGroup}>
            <Text style={styles.date}>{getRelativeDate(run.startTime)}</Text>
            <Text style={styles.timeDot}>•</Text>
            <Text style={styles.time}>{formatTime(run.startTime)}</Text>
          </View>

          {/* Mode Badge Indicator */}
          {isExam ? (
            <View style={[styles.modeBadge, isPassed ? styles.badgePassed : styles.badgeExam]}>
              <Ionicons
                name={isPassed ? 'checkmark-circle' : 'trophy-outline'}
                size={11}
                color={isPassed ? COLORS.primaryDark : COLORS.secondaryDark}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.badgeText, isPassed ? styles.badgeTextPassed : styles.badgeTextExam]}>
                {isPassed ? 'PASSED' : 'EXAM'}
              </Text>
            </View>
          ) : (
            <View style={[styles.modeBadge, styles.badgeFree]}>
              <Ionicons
                name="fitness-outline"
                size={11}
                color={COLORS.primary}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.badgeText, styles.badgeTextFree]}>FREE</Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.distance,
            { color: isExam ? COLORS.secondaryDark : COLORS.primary },
          ]}
        >
          {formatDistance(run.distance, currentUnit)}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(run.duration)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{isSpeed ? 'Speed' : 'Pace'}</Text>
            <Text style={styles.statValue}>{formatMetric(run.pace, currentUnit, settings.metricDisplay)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Cal</Text>
            <Text style={styles.statValue}>{Math.round(run.calories || 0)}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} style={styles.arrow} />
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
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '700' },
  timeDot: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginHorizontal: 4 },
  time: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeExam: {
    backgroundColor: COLORS.secondaryLight,
  },
  badgePassed: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeFree: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badgeTextExam: {
    color: COLORS.secondaryDark,
  },
  badgeTextPassed: {
    color: COLORS.primaryDark,
  },
  badgeTextFree: {
    color: COLORS.textSecondary,
  },
  distance: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1 },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  arrow: { marginLeft: SPACING.xs },
});
