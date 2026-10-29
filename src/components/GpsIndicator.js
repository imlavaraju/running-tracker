/**
 * GpsIndicator Component
 * Displays live GPS availability & signal strength in the header.
 * Shows signal bars (Off, Weak, Moderate, Strong) and opens an
 * informative status sheet with permission / accuracy details and refresh action.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useLocation } from '../contexts/LocationContext';

export default function GpsIndicator() {
  const {
    gpsState,
    accuracy,
    servicesEnabled: isServicesEnabled,
    permissionStatus,
    checkLocationStatus,
    openLocationSettings,
  } = useLocation();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkLocationStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenSettings = () => {
    openLocationSettings();
  };

  // Compute visual tokens
  const getStatusDetails = () => {
    switch (gpsState) {
      case 'strong':
        return {
          color: COLORS.primary,
          label: 'Strong GPS',
          sub: accuracy ? `High accuracy (~${Math.round(accuracy)}m lock)` : 'Ready for tracking',
          bars: 3,
          icon: 'navigate',
        };
      case 'moderate':
        return {
          color: COLORS.secondary,
          label: 'GPS Active',
          sub: accuracy ? `Medium accuracy (~${Math.round(accuracy)}m)` : 'Searching for high-precision lock...',
          bars: 2,
          icon: 'navigate-outline',
        };
      case 'weak':
        return {
          color: COLORS.secondary,
          label: 'Weak Signal',
          sub: accuracy ? `Low accuracy (~${Math.round(accuracy)}m)` : 'Move to open sky for better signal',
          bars: 1,
          icon: 'navigate-outline',
        };
      case 'denied':
        return {
          color: COLORS.error,
          label: 'Permission Denied',
          sub: 'Location access is required to track runs',
          bars: 0,
          icon: 'navigate-outline',
        };
      case 'off':
      default:
        return {
          color: COLORS.textMuted,
          label: 'GPS Off',
          sub: 'Device location service is disabled',
          bars: 0,
          icon: 'navigate-outline',
        };
    }
  };

  const status = getStatusDetails();

  const getBarColor = (barIndex) => {
    if (barIndex <= status.bars) {
      return status.color;
    }
    return COLORS.border;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={() => setIsModalVisible(true)}
        accessibilityLabel={`GPS: ${status.label}`}
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      >
        <Ionicons name={status.icon} size={18} color={status.color} />
        <View style={styles.barsContainer}>
          <View style={[styles.signalBar, styles.bar1, { backgroundColor: getBarColor(1) }]} />
          <View style={[styles.signalBar, styles.bar2, { backgroundColor: getBarColor(2) }]} />
          <View style={[styles.signalBar, styles.bar3, { backgroundColor: getBarColor(3) }]} />
        </View>
      </TouchableOpacity>

      {/* GPS Info & Diagnosis Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.statusIconCircle, { backgroundColor: status.color + '15' }]}>
                  <Ionicons name={status.icon} size={22} color={status.color} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>GPS & Location</Text>
                  <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>{status.sub}</Text>

            {/* Status Checklist */}
            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <Ionicons
                  name={isServicesEnabled ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={isServicesEnabled ? COLORS.primary : COLORS.error}
                />
                <Text style={styles.checkLabel}>Device Location Services</Text>
                <Text style={[styles.checkValue, { color: isServicesEnabled ? COLORS.primaryDark : COLORS.error }]}>
                  {isServicesEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>

              <View style={styles.checkDivider} />

              <View style={styles.checkItem}>
                <Ionicons
                  name={permissionStatus === 'granted' ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={permissionStatus === 'granted' ? COLORS.primary : COLORS.error}
                />
                <Text style={styles.checkLabel}>App Permission</Text>
                <Text style={[styles.checkValue, { color: permissionStatus === 'granted' ? COLORS.primaryDark : COLORS.error }]}>
                  {permissionStatus === 'granted' ? 'GRANTED' : 'DENIED'}
                </Text>
              </View>

              <View style={styles.checkDivider} />

              <View style={styles.checkItem}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={accuracy ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.checkLabel}>Estimated Precision</Text>
                <Text style={styles.checkValue}>
                  {accuracy ? `±${Math.round(accuracy)} meters` : 'Searching...'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={handleManualRefresh}
                disabled={isRefreshing}
                activeOpacity={0.8}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color={COLORS.surface} style={{ marginRight: 6 }} />
                    <Text style={styles.refreshBtnText}>Refresh GPS</Text>
                  </>
                )}
              </TouchableOpacity>

              {(!isServicesEnabled || permissionStatus !== 'granted') && (
                <TouchableOpacity
                  style={styles.settingsActionBtn}
                  onPress={handleOpenSettings}
                  activeOpacity={0.8}
                >
                  <Ionicons name="settings-outline" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                  <Text style={styles.settingsActionText}>Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    marginRight: SPACING.sm,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 5,
    height: 12,
    width: 14,
    justifyContent: 'space-between',
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
  },
  bar1: { height: 4 },
  bar2: { height: 8 },
  bar3: { height: 12 },

  // Modal
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
    marginBottom: SPACING.xs,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginTop: 1,
  },
  modalSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkLabel: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  checkValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  checkDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  refreshBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  settingsActionBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsActionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});

