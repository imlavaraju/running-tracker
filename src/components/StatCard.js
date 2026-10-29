import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

export default function StatCard({ title, value, subtitle, icon, color = COLORS.primary }) {
  // Support both Ionicons name and fallback
  const isIonicon = typeof icon === 'string' && (icon.includes('-') || !icon.match(/\p{Extended_Pictographic}/u));

  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: color + '15' }]}>
        {isIonicon ? (
          <Ionicons name={icon} size={20} color={color} />
        ) : (
          <Text style={styles.iconFallback}>{icon}</Text>
        )}
      </View>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  iconFallback: {
    fontSize: 18,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  title: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
