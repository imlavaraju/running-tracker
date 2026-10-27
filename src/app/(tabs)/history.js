/**
 * History Screen — List of all past runs
 */

import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useRuns } from '../../contexts/RunContext';
import { useSettings } from '../../contexts/SettingsContext';
import RunCard from '../../components/RunCard';
import EmptyState from '../../components/EmptyState';

export default function HistoryScreen() {
  const { runs, isLoading } = useRuns();
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
        <Text style={styles.title}>Run History</Text>
        <Text style={styles.count}>{runs.length} run{runs.length !== 1 ? 's' : ''}</Text>
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
          icon="📋"
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.text },
  count: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  list: { paddingBottom: SPACING.xl },
});

