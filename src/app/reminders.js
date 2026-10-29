/**
 * Run Reminders Screen
 * Multi-day reminder manager:
 * - Shows all 7 days of the week
 * - Radio toggle per day
 * - Independent reminder time per day
 * - Bottom controls to "Turn On All" and "Turn Off All"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useSettings, DEFAULT_WEEK_REMINDERS } from '../contexts/SettingsContext';

const QUICK_TIMES = [
  '05:30 AM',
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
];

const HOURS = ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03'];
const MINUTES = ['00', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings,
    toggleDayReminder,
    setDayReminderTime,
    turnOnAllReminders,
    turnOffAllReminders,
  } = useSettings();

  const reminders = settings.dailyReminders || DEFAULT_WEEK_REMINDERS;
  const activeCount = reminders.filter((r) => r.enabled).length;

  // Time Picker Modal State
  const [selectedDay, setSelectedDay] = useState(null);
  const [pickerHour, setPickerHour] = useState('06');
  const [pickerMinute, setPickerMinute] = useState('30');
  const [pickerPeriod, setPickerPeriod] = useState('AM'); // 'AM' | 'PM'

  const openTimePicker = (dayItem) => {
    setSelectedDay(dayItem);
    // Parse current time e.g. "06:30 AM"
    const match = (dayItem.time || '06:30 AM').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      setPickerHour(match[1].padStart(2, '0'));
      setPickerMinute(match[2]);
      setPickerPeriod(match[3].toUpperCase());
    } else {
      setPickerHour('06');
      setPickerMinute('30');
      setPickerPeriod('AM');
    }
  };

  const applyCustomTime = async () => {
    if (!selectedDay) return;
    const formatted = `${pickerHour}:${pickerMinute} ${pickerPeriod}`;
    await setDayReminderTime(selectedDay.id, formatted);
    setSelectedDay(null);
  };

  const applyQuickTime = async (timeStr) => {
    if (!selectedDay) return;
    await setDayReminderTime(selectedDay.id, timeStr);
    setSelectedDay(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Scrollable Days List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons
              name={activeCount > 0 ? 'alarm' : 'alarm-outline'}
              size={28}
              color={activeCount > 0 ? COLORS.primary : COLORS.textLight}
            />
          </View>
          <View style={styles.summaryTextGroup}>
            <Text style={styles.summaryTitle}>
              {activeCount === 0
                ? 'All Reminders Turned Off'
                : activeCount === 7
                  ? 'Everyday Workout Reminders'
                  : `${activeCount} of 7 Days Active`}
            </Text>
            <Text style={styles.summarySub}>
              Tap the radio to enable or disable any day. Each day can have its own customized reminder time.
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionHeader}>Weekly Schedule</Text>

        {/* Days List */}
        <View style={styles.card}>
          {reminders.map((item, index) => {
            const isLast = index === reminders.length - 1;
            return (
              <View key={item.id}>
                <View style={styles.dayRow}>
                  {/* Left: Radio Button & Day Label */}
                  <TouchableOpacity
                    style={styles.radioHitbox}
                    onPress={() => toggleDayReminder(item.id)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: item.enabled }}
                    accessibilityLabel={`${item.day} reminder ${item.enabled ? 'active' : 'disabled'}`}
                  >
                    <Ionicons
                      name={item.enabled ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={item.enabled ? COLORS.primary : COLORS.textLight}
                      style={{ marginRight: SPACING.md }}
                    />
                    <View>
                      <Text style={[styles.dayName, !item.enabled && styles.dayNameDisabled]}>
                        {item.day}
                      </Text>
                      <Text style={[styles.dayStatus, item.enabled && styles.dayStatusActive]}>
                        {item.enabled ? 'Scheduled' : 'Off'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Right: Time Selector Pill */}
                  <TouchableOpacity
                    style={[
                      styles.timePill,
                      item.enabled && styles.timePillActive,
                    ]}
                    onPress={() => openTimePicker(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Set reminder time for ${item.day}, currently ${item.time}`}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={item.enabled ? COLORS.primaryDark : COLORS.textMuted}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.timePillText,
                        item.enabled && styles.timePillTextActive,
                      ]}
                    >
                      {item.time}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={12}
                      color={item.enabled ? COLORS.primaryDark : COLORS.textLight}
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                </View>
                {!isLast && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FIXED BOTTOM CONTROLS: TURN ON ALL & TURN OFF ALL */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bulkButtonsRow}>
          {/* Turn On All */}
          <TouchableOpacity
            style={[styles.bulkBtn, styles.turnOnAllBtn]}
            onPress={turnOnAllReminders}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.turnOnAllText}>Turn On All</Text>
          </TouchableOpacity>

          {/* Turn Off All */}
          <TouchableOpacity
            style={[styles.bulkBtn, styles.turnOffAllBtn]}
            onPress={turnOffAllReminders}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.turnOffAllText}>Turn Off All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TIME PICKER MODAL */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedDay(null)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Set Reminder Time</Text>
                <Text style={styles.modalSub}>{selectedDay?.day}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDay(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Custom Time Selector Wheels */}
            <View style={styles.timeSelectRow}>
              {/* Hours */}
              <View style={styles.timeCol}>
                <Text style={styles.timeColLabel}>Hour</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, pickerHour === h && styles.pickerItemActive]}
                      onPress={() => setPickerHour(h)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          pickerHour === h && styles.pickerItemTextActive,
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.colonSeparator}>:</Text>

              {/* Minutes */}
              <View style={styles.timeCol}>
                <Text style={styles.timeColLabel}>Minute</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, pickerMinute === m && styles.pickerItemActive]}
                      onPress={() => setPickerMinute(m)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          pickerMinute === m && styles.pickerItemTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM / PM Toggle */}
              <View style={styles.timeColPeriod}>
                <Text style={styles.timeColLabel}>Period</Text>
                <View style={styles.periodToggleContainer}>
                  {['AM', 'PM'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.periodBtn,
                        pickerPeriod === p && styles.periodBtnActive,
                      ]}
                      onPress={() => setPickerPeriod(p)}
                    >
                      <Text
                        style={[
                          styles.periodBtnText,
                          pickerPeriod === p && styles.periodBtnTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Quick Presets Section */}
            <Text style={styles.quickLabel}>Popular Times</Text>
            <View style={styles.quickGrid}>
              {QUICK_TIMES.map((qt) => (
                <TouchableOpacity
                  key={qt}
                  style={styles.quickChip}
                  onPress={() => applyQuickTime(qt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickChipText}>{qt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={applyCustomTime}
              activeOpacity={0.88}
            >
              <Text style={styles.modalApplyBtnText}>
                Set {pickerHour}:{pickerMinute} {pickerPeriod} for {selectedDay?.day}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  summarySub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  sectionHeader: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },

  // Card & Days List
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  radioHitbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNameDisabled: {
    color: COLORS.textSecondary,
  },
  dayStatus: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  dayStatusActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SPACING.md + 24 + SPACING.md,
  },

  // Time Pill
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  timePillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  timePillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  timePillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Fixed Bottom Controls Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  turnOnAllBtn: {
    backgroundColor: COLORS.primaryLight,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  turnOnAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  turnOffAllBtn: {
    backgroundColor: COLORS.background,
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  turnOffAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },

  // Time Select Wheels
  timeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  timeCol: {
    alignItems: 'center',
    width: 64,
  },
  timeColPeriod: {
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  timeColLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeScroll: {
    height: 120,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: 2,
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary,
  },
  pickerItemText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  pickerItemTextActive: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  colonSeparator: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textLight,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  periodToggleContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    marginTop: 4,
  },
  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  periodBtnTextActive: {
    color: COLORS.surface,
  },

  // Quick Chips
  quickLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  quickChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  quickChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Apply Modal Button
  modalApplyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});

