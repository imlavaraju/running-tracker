import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

export default function StatCard({ title, value, subtitle, icon, color = COLORS.primary }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
  },
  iconBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  icon: { fontSize: 18 },
  value: { fontSize: FONT_SIZES.xxl, fontWeight: '700' },
  title: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  subtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: 2 },
});

