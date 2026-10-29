/**
 * Run Details Screen — Full breakdown of a single run with Route Map visualization
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  formatDistance, formatDuration, formatPace, formatDate, formatTime, formatCalories,
} from '../../utils/formatters';

export default function RunDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { getRun, deleteRun } = useRuns();
  const { settings } = useSettings();
  const unit = settings.unit;
  const run = getRun(id);
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  const locations = useMemo(() => (Array.isArray(run?.locations) ? run.locations : []), [run]);

  const fitMapToRoute = useCallback(() => {
    if (!mapRef.current || locations.length === 0) return;
    if (locations.length === 1) {
      mapRef.current.animateToRegion({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else {
      mapRef.current.fitToCoordinates(locations, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: true,
      });
    }
  }, [locations]);

  useEffect(() => {
    if (locations.length > 0) {
      const timer = setTimeout(() => {
        fitMapToRoute();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [locations, fitMapToRoute]);

  if (!run) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Run not found</Text>
      </View>
    );
  }

  const isExam = run.mode === 'exam' || !!run.targetKm;
  const isPassed = isExam && run.challengeMet;

  const initialRegion = locations.length > 0
    ? {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  const handleDelete = () => {
    Alert.alert('Delete Run', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRun(run.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Route Map Header */}
        {locations.length > 0 ? (
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapContainer}>
                {React.createElement('iframe', {
                  title: 'Run Route Map',
                  style: { border: 0, width: '100%', height: '100%' },
                  src: `https://www.openstreetmap.org/export/embed.html?bbox=${(locations[0]?.longitude || -122.4324) - 0.01}%2C${(locations[0]?.latitude || 37.78825) - 0.01}%2C${(locations[0]?.longitude || -122.4324) + 0.01}%2C${(locations[0]?.latitude || 37.78825) + 0.01}&layer=mapnik&marker=${locations[0]?.latitude || 37.78825}%2C${locations[0]?.longitude || -122.4324}`,
                })}
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                showsCompass={true}
                showsScale={true}
                loadingEnabled={true}
                loadingIndicatorColor={COLORS.primary}
                loadingBackgroundColor="#F1F5F9"
                onMapReady={fitMapToRoute}
              >
                <Polyline
                  coordinates={locations}
                  strokeColor="#FF3B30"
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
                <Marker
                  coordinate={locations[0]}
                  title="Start"
                  pinColor="#00E676"
                />
                {locations.length > 1 && (
                  <Marker
                    coordinate={locations[locations.length - 1]}
                    title="Finish"
                    pinColor="#FF3B30"
                  />
                )}
              </MapView>
            )}

            <View style={styles.mapBadge}>
              <Ionicons name="trail-sign-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.mapBadgeText}>ROUTE MAP • {locations.length} PTS</Text>
            </View>

            <TouchableOpacity
              style={styles.recenterBtn}
              onPress={fitMapToRoute}
              activeOpacity={0.8}
              accessibilityLabel="Fit map to route"
            >
              <Ionicons name="scan-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noMapCard}>
            <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.noMapText}>No GPS route points recorded for this run</Text>
          </View>
        )}

        {/* Exam Target Breakdown Card (if Exam Mode) */}
        {isExam && (
          <View style={styles.examBreakdownCard}>
            <Text style={styles.examBreakdownTitle}>Target Challenge Criteria</Text>
            <View style={styles.examBreakdownRow}>
              <View style={styles.examBreakdownCol}>
                <Text style={styles.examBreakdownLabel}>Target Distance</Text>
                <Text style={styles.examBreakdownVal}>{run.targetKm ? `${run.targetKm} km` : '--'}</Text>
              </View>
              <View style={styles.examBreakdownDivider} />
              <View style={styles.examBreakdownCol}>
                <Text style={styles.examBreakdownLabel}>Time Limit</Text>
                <Text style={styles.examBreakdownVal}>{run.targetMinutes ? `${run.targetMinutes} min` : '--'}</Text>
              </View>
              <View style={styles.examBreakdownDivider} />
              <View style={styles.examBreakdownCol}>
                <Text style={styles.examBreakdownLabel}>Result</Text>
                <Text style={[styles.examBreakdownVal, { color: isPassed ? COLORS.primary : COLORS.secondary }]}>
                  {isPassed ? 'Passed' : 'Completed'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stat Grid */}
        <View style={styles.statsCard}>
          <View style={styles.summary}>
            <View style={[styles.modePill, isExam && { backgroundColor: isPassed ? COLORS.primaryLight : COLORS.secondaryLight }]}>
              <Ionicons
                name={isExam ? 'trophy' : 'fitness-outline'}
                size={13}
                color={isExam ? (isPassed ? COLORS.primaryDark : COLORS.secondaryDark) : COLORS.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.modePillText, isExam && { color: isPassed ? COLORS.primaryDark : COLORS.secondaryDark }]}>
                {isExam ? (isPassed ? 'EXAM PASSED' : 'EXAM CHALLENGE') : 'FREE RUN'}
              </Text>
            </View>
            <Text style={styles.summaryDate}>{formatDate(run.startTime)} • {formatTime(run.startTime)}</Text>
            <Text style={[styles.summaryDistance, isExam && { color: isPassed ? COLORS.primary : COLORS.secondaryDark }]}>
              {formatDistance(run.distance, unit)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <DetailStat label="Duration" value={formatDuration(run.duration)} icon="time-outline" color={COLORS.accent} />
            <DetailStat label="Pace" value={formatPace(run.pace, unit)} icon="speedometer-outline" color={COLORS.primary} />
          </View>
          <View style={styles.statRow}>
            <DetailStat label="Calories" value={formatCalories(run.calories)} icon="flame-outline" color={COLORS.secondary} />
            <DetailStat
              label="Locations"
              value={`${locations.length} pts`}
              icon="location-outline"
              color={COLORS.primaryDark}
            />
          </View>
        </View>

        {/* Splits */}
        {run.splits && run.splits.length > 0 && (
          <View style={styles.splitsCard}>
            <Text style={styles.sectionTitle}>Splits</Text>
            {run.splits.map((split, i) => (
              <View key={i} style={styles.splitRow}>
                <Text style={styles.splitKm}>
                  {unit === 'mi' ? `Mile ${split.km}` : `Km ${split.km}`}
                </Text>
                <Text style={styles.splitTime}>{formatDuration(split.time)}</Text>
                <Text style={styles.splitPace}>
                  {formatPace(split.time, unit)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} style={{ marginRight: 6 }} />
          <Text style={styles.deleteBtnText}>Delete Run</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function DetailStat({ label, value, icon, color = COLORS.text }) {
  return (
    <View style={styles.detailStat}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },

  // Map Container
  mapContainer: {
    height: 260,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  mapBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noMapCard: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  noMapText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Summary (top of stats card)
  summary: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  modePillText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  summaryDate: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  summaryDistance: { fontSize: 44, fontWeight: '800', color: COLORS.primary, marginTop: SPACING.xs, letterSpacing: -1 },

  // Exam Breakdown Card
  examBreakdownCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
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
  examBreakdownTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  examBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examBreakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  examBreakdownLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  examBreakdownVal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  examBreakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  // Stats Card
  statsCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
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
  statRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  detailStat: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  detailValue: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },

  // Splits Card
  splitsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
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
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  splitKm: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '600', flex: 1 },
  splitTime: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1, textAlign: 'center', fontWeight: '500' },
  splitPace: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '700', flex: 1, textAlign: 'right' },

  // Delete Button
  deleteBtn: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: COLORS.error, fontSize: FONT_SIZES.md, fontWeight: '700' },
});
