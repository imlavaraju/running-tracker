/**
 * Settings Screen
 * Google Play compliant, offline-first configuration:
 * Units, Pace/Speed, Language, Reminders, Location Permissions, Privacy Policy & Support.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Linking, Modal, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';
import { useLocation } from '../contexts/LocationContext';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
];

const REMINDER_TIMES = [
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '05:30 PM',
  '06:30 PM',
  '12:25 AM'
];

const PRIVACY_POLICY_URL = 'https://policies.google.com/privacy';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const {
    servicesEnabled: servicesOn,
    permissionStatus: locationPerm,
    openLocationSettings: handleOpenAppSettings,
  } = useLocation();
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const handleOpenPrivacyWeb = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      setIsPrivacyModalOpen(true);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@runningtracker.local?subject=Running%20Tracker%20Support');
  };

  const currentLang = LANGUAGES.find((l) => l.code === settings.language) || LANGUAGES[0];
  const dailyReminders = settings.dailyReminders || [];
  const activeDaysCount = dailyReminders.filter((d) => d.enabled).length;
  const activeDaysSummary =
    activeDaysCount === 0
      ? 'Disabled'
      : activeDaysCount === 7
        ? 'Scheduled everyday'
        : `${activeDaysCount} day${activeDaysCount > 1 ? 's' : ''} scheduled`;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION: UNITS & DISPLAY */}
        <Text style={styles.sectionLabel}>Units & Display</Text>
        <View style={styles.card}>
          {/* Distance Unit */}
          <Text style={styles.itemTitle}>Distance Unit</Text>
          <View style={styles.toggleRow}>
            {['km', 'mi'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.toggleBtn, settings.unit === u && styles.toggleActive]}
                onPress={() => updateSettings({ unit: u })}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, settings.unit === u && styles.toggleTextActive]}>
                  {u === 'km' ? 'Kilometers (km)' : 'Miles (mi)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.cardDivider} />

          {/* Metric: Speed vs Pace */}
          <Text style={styles.itemTitle}>Running Metric</Text>
          <View style={styles.toggleRow}>
            {[
              { id: 'pace', label: `Pace (min/${settings.unit})` },
              { id: 'speed', label: `Speed (${settings.unit === 'mi' ? 'mph' : 'km/h'})` },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.toggleBtn, (settings.metricDisplay || 'pace') === m.id && styles.toggleActive]}
                onPress={() => updateSettings({ metricDisplay: m.id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, (settings.metricDisplay || 'pace') === m.id && styles.toggleTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION: PREFERENCES (LANGUAGE & REMINDER) */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          {/* Language Selector */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setIsLangModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="language-outline" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.rowTitle}>Language</Text>
                <Text style={styles.rowSub}>{currentLang.native} ({currentLang.name})</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          {/* Daily Run Reminders (Opens Dedicated Multi-Day Screen) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/reminders')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="alarm-outline" size={20} color={COLORS.secondary} style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.rowTitle}>Run Reminders</Text>
                <Text style={styles.rowSub}>
                  {activeDaysSummary}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: activeDaysCount > 0 ? COLORS.primary : COLORS.textLight,
                  fontWeight: '600',
                  marginRight: 6,
                }}
              >
                {activeDaysCount > 0 ? `${activeDaysCount}/7 active` : 'Off'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION: LOCATION & PERMISSIONS (Google Play Requirement) */}
        <Text style={styles.sectionLabel}>Location & Permissions</Text>
        <View style={styles.card}>
          <View style={styles.permissionStatusRow}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={locationPerm === 'granted' && servicesOn ? 'navigate-circle' : 'alert-circle'}
                size={24}
                color={locationPerm === 'granted' && servicesOn ? COLORS.primary : COLORS.error}
                style={{ marginRight: SPACING.sm }}
              />
              <View>
                <Text style={styles.rowTitle}>Location Access</Text>
                <Text style={[styles.rowSub, { color: locationPerm === 'granted' && servicesOn ? COLORS.primaryDark : COLORS.error }]}>
                  {locationPerm === 'granted' && servicesOn
                    ? 'Active & Granted (Foreground)'
                    : !servicesOn
                      ? 'Device Location is Turned Off'
                      : 'Permission Denied'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.permissionActionBtn}
              onPress={handleOpenAppSettings}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionActionBtnText}>App Settings</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.permissionExplanation}>
            Running Tracker accesses your location strictly in the foreground while you actively record a run to calculate distance, current pace, and GPS path.
          </Text>
        </View>

        {/* SECTION: PRIVACY & LEGAL (Google Play Requirement) */}
        <Text style={styles.sectionLabel}>Privacy & Data Safety</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleOpenPrivacyWeb}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.rowTitle}>Privacy Policy</Text>
                <Text style={styles.rowSub}>Opens official public privacy policy</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setIsPrivacyModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.accent} style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.rowTitle}>Data Storage Details</Text>
                <Text style={styles.rowSub}>100% on-device • No cloud • No account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* SECTION: HELP & SUPPORT */}
        <Text style={styles.sectionLabel}>Help & Support</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
              <View>
                <Text style={styles.rowTitle}>Contact Developer Support</Text>
                <Text style={styles.rowSub}>support@runningtracker.local</Text>
              </View>
            </View>
            <Ionicons name="send-outline" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* SECTION: ABOUT APP */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutName}>Running Tracker</Text>
            <Text style={styles.aboutVersion}>v1.0.0</Text>
          </View>
          <Text style={styles.aboutSub}>
            Offline-first running & exam performance tracker. Built with Expo & React Native.
          </Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal
        visible={isLangModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLangModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsLangModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Language</Text>
              <TouchableOpacity onPress={() => setIsLangModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => {
              const isSelected = (settings.language || 'en') === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, isSelected && styles.langOptionSelected]}
                  onPress={() => {
                    updateSettings({ language: lang.code });
                    setIsLangModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={[styles.langName, isSelected && styles.langNameSelected]}>{lang.native}</Text>
                    <Text style={styles.langSub}>{lang.name}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* LOCAL PRIVACY POLICY MODAL */}
      <Modal
        visible={isPrivacyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsPrivacyModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Data Safety & Privacy</Text>
              <TouchableOpacity onPress={() => setIsPrivacyModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.policyHeading}>1. Local Storage Exclusively</Text>
              <Text style={styles.policyBody}>
                All run logs, routes, distances, and user settings stay entirely on this device in private application storage. There is no remote database or cloud backup.
              </Text>

              <Text style={styles.policyHeading}>2. Location & GPS Usage</Text>
              <Text style={styles.policyBody}>
                Location is queried exclusively while an active session is in progress (Foreground Location). It is required to compute real-time distance and speed. It is never logged in the background and never sent over any network.
              </Text>

              <Text style={styles.policyHeading}>3. No Accounts & No Tracking</Text>
              <Text style={styles.policyBody}>
                Running Tracker does not require registration, login, phone numbers, or analytics SDKs. No personal telemetry or advertising identifiers are collected.
              </Text>

              <Text style={styles.policyHeading}>4. Complete User Control</Text>
              <Text style={styles.policyBody}>
                You can delete individual runs or clear all app data at any time through the device app settings.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.closePolicyBtn}
              onPress={() => setIsPrivacyModalOpen(false)}
            >
              <Text style={styles.closePolicyBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md + 4,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm + 2,
  },
  itemTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleActive: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: COLORS.primary, fontWeight: '800' },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Reminder Chips
  reminderTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeChip: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipSelected: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  timeChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeChipTextSelected: {
    color: COLORS.secondaryDark,
    fontWeight: '800',
  },

  // Location Permissions
  permissionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionActionBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.full,
  },
  permissionActionBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  permissionExplanation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // About
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  aboutVersion: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  aboutSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 2,
  },
  langOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  langName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  langNameSelected: {
    color: COLORS.primaryDark,
  },
  langSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  policyHeading: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
  },
  policyBody: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  closePolicyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  closePolicyBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
