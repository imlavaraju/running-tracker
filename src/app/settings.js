/**
 * Settings Screen — User preferences
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';
import { formatDistance } from '../utils/formatters';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();

  const toggleUnit = () => {
    updateSettings({ unit: settings.unit === 'km' ? 'mi' : 'km' });
  };

  const setWeight = (text) => {
    const w = parseInt(text, 10);
    if (!isNaN(w) && w > 0 && w < 500) {
      updateSettings({ weight: w });
    }
  };

  const goals = [10000, 15000, 20000, 30000, 50000];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Unit */}
      <Text style={styles.sectionLabel}>Distance Unit</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          {['km', 'mi'].map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.toggleBtn, settings.unit === u && styles.toggleActive]}
              onPress={() => updateSettings({ unit: u })}
            >
              <Text style={[styles.toggleText, settings.unit === u && styles.toggleTextActive]}>
                {u === 'km' ? 'Kilometers' : 'Miles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weight */}
      <Text style={styles.sectionLabel}>Body Weight (kg)</Text>
      <View style={styles.card}>
        <View style={styles.weightRow}>
          <TouchableOpacity
            style={styles.weightBtn}
            onPress={() => updateSettings({ weight: Math.max(30, settings.weight - 1) })}
          >
            <Text style={styles.weightBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{settings.weight} kg</Text>
          <TouchableOpacity
            style={styles.weightBtn}
            onPress={() => updateSettings({ weight: Math.min(300, settings.weight + 1) })}
          >
            <Text style={styles.weightBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Used for calorie estimation</Text>
      </View>

      {/* Weekly Goal */}
      <Text style={styles.sectionLabel}>Weekly Goal</Text>
      <View style={styles.card}>
        {goals.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.goalRow, settings.weeklyGoal === g && styles.goalRowActive]}
            onPress={() => updateSettings({ weeklyGoal: g })}
          >
            <Text
              style={[styles.goalText, settings.weeklyGoal === g && styles.goalTextActive]}
            >
              {formatDistance(g, settings.unit)}
            </Text>
            {settings.weeklyGoal === g && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <Text style={styles.aboutText}>Running Tracker v1.0.0</Text>
        <Text style={styles.aboutSub}>Built with Expo SDK 58</Text>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  sectionLabel: {
    fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: SPACING.lg, marginBottom: SPACING.sm, marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row', backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleActive: { backgroundColor: COLORS.surface },
  toggleText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: COLORS.primary, fontWeight: '700' },
  weightRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  weightBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  weightBtnText: { fontSize: 22, color: COLORS.primary, fontWeight: '700' },
  weightValue: {
    fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text,
    marginHorizontal: SPACING.xl,
  },
  hint: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: 'center', marginTop: SPACING.sm },
  goalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm + 4, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  goalRowActive: { },
  goalText: { fontSize: FONT_SIZES.lg, color: COLORS.text },
  goalTextActive: { color: COLORS.primary, fontWeight: '700' },
  checkmark: { fontSize: FONT_SIZES.xl, color: COLORS.primary, fontWeight: '700' },
  aboutText: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '500' },
  aboutSub: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, marginTop: 4 },
});

