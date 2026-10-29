/**
 * History Screen — List of all past runs
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import RunCard from '../../components/RunCard';
import EmptyState from '../../components/EmptyState';
import GpsIndicator from '../../components/GpsIndicator';

export default function HistoryScreen() {
  const { runs } = useRuns();
  const { settings } = useSettings();

  const renderItem = ({ item }) => (
    <RunCard
      run={item}
      unit={settings.unit}
      onPress={() => router.push(`/run-details/${item.id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Run History</Text>
          <Text style={styles.count}>{runs.length} run{runs.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerRightActions}>
          <GpsIndicator />
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {runs.length > 0 ? (
        <FlatList
          data={runs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="No run history"
          message="Complete your first run and it will appear here."
          actionLabel="Start a Run"
          onAction={() => router.push('/run')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 120,
  },
});
