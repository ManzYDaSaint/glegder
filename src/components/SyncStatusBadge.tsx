import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAppDatabase } from '../context/DatabaseContext';

export default function SyncStatusBadge() {
  const { isOnline, isSyncing, pendingSyncCount, triggerSync } = useAppDatabase();

  // If currently pushing pending items
  if (isSyncing && pendingSyncCount > 0) {
    return (
      <View style={[styles.badge, styles.syncingBadge]}>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
        <Text style={styles.syncingText}>Syncing...</Text>
      </View>
    );
  }

  // Connected to internet
  if (isOnline) {
    return (
      <TouchableOpacity
        style={[styles.badge, styles.onlineBadge]}
        onPress={() => triggerSync()}
        activeOpacity={0.8}
      >
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>
          {pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Synced'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Offline ("Alibe Bundle") state
  return (
    <View style={[styles.badge, styles.offlineBadge]}>
      <Ionicons name="cloud-offline-outline" size={13} color={COLORS.warning} style={{ marginRight: 5 }} />
      <Text style={styles.offlineText}>
        {pendingSyncCount > 0 ? `${pendingSyncCount} Offline` : 'Offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  onlineBadge: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  onlineText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBadge: {
    backgroundColor: COLORS.warningBg,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  offlineText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  syncingBadge: {
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.border,
  },
  syncingText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
