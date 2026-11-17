import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/theme';
import {
  getShopProfile,
  updateShopProfile,
  clearAllLocalData,
  getCashSummary,
  getDebtSummary,
  getUnsyncedRecords,
} from '../../db';
import { syncOfflineQueue, syncShopToSupabase } from '../../services/syncService';
import { normalizeMalawiPhone } from '../../services/smsService';
import { ShopProfile } from '../../types';
import { formatCurrency } from '../../utils/format';
import { router } from 'expo-router';

const HAS_ONBOARDED_KEY = '@glegder_has_onboarded_v1';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState('Just now');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Quick stats
  const [todayBalance, setTodayBalance] = useState(0);
  const [debtCount, setDebtCount] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState('MWK');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const p = await getShopProfile();
      setProfile(p);
      if (p) {
        setEditName(p.name);
        setEditCurrency(p.currency || 'MWK');
      }

      const [cash, debt, dirty] = await Promise.all([
        getCashSummary(),
        getDebtSummary(),
        getUnsyncedRecords(),
      ]);

      setTodayBalance(cash.todayBalance);
      setDebtCount(debt.customerCount);
      const totalPending =
        dirty.transactions.length + dirty.customers.length + dirty.loans.length;
      setPendingSyncCount(totalPending);
    } catch (err) {
      console.error('Error loading shop profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
      setLastSyncedText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const dirty = await getUnsyncedRecords();
      setPendingSyncCount(dirty.transactions.length + dirty.customers.length + dirty.loans.length);
      Alert.alert('Cloud Sync Complete', 'All offline records have been synced with your cloud backup.');
    } catch {
      Alert.alert('Sync Incomplete', 'Could not reach server. Data is stored safely on phone.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter a valid shop name.');
      return;
    }
    setIsSaving(true);
    try {
      await updateShopProfile({
        name: editName.trim(),
        currency: editCurrency.trim() || 'MWK',
      });
      const updated = await getShopProfile();
      setProfile(updated);
      if (updated) {
        await syncShopToSupabase(updated);
      }
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Shop details updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save shop details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Switch Shop / Sign Out',
      'Signing out will clear this shop session from the device. Make sure your records are synced to the cloud first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllLocalData();
              await AsyncStorage.removeItem(HAS_ONBOARDED_KEY);
              // Reload app to return to Onboarding / Auth
              router.replace('/');
            } catch (err) {
              console.error('Failed to log out:', err);
            }
          },
        },
      ]
    );
  };

  const getOperatorName = (phone?: string) => {
    if (!phone) return null;
    const norm = normalizeMalawiPhone(phone);
    if (norm.startsWith('2658')) return 'TNM Malawi';
    if (norm.startsWith('2659')) return 'Airtel Malawi';
    return 'Malawi Network';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const shopInitials = profile?.name
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'GL';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Shop Profile</Text>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => setIsEditModalOpen(true)}
          >
            <Ionicons name="pencil-outline" size={18} color={COLORS.primaryLight} />
            <Text style={styles.editHeaderBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Shop Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopCardTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{shopInitials}</Text>
            </View>
            <View style={styles.shopMeta}>
              <Text style={styles.shopNameText}>{profile?.name || 'My Shop'}</Text>
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.phoneText}>
                  +{profile?.phone ? normalizeMalawiPhone(profile.phone) : '265...'}
                </Text>
              </View>
              {profile?.phone && (
                <View style={styles.operatorTag}>
                  <Text style={styles.operatorTagText}>{getOperatorName(profile.phone)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsDivider} />
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TODAY'S CASHFLOW</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: todayBalance >= 0 ? COLORS.cashIn : COLORS.cashOut },
                ]}
              >
                {formatCurrency(todayBalance)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ACTIVE DEBTORS</Text>
              <Text style={styles.metricValue}>{debtCount} customers</Text>
            </View>
          </View>
        </View>

        {/* Cloud Sync & Backup Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cloud-done-outline" size={20} color={COLORS.primaryLight} />
              <Text style={styles.sectionTitle}>Cloud Backup & Sync</Text>
            </View>
            <View
              style={[
                styles.syncBadge,
                pendingSyncCount > 0 ? styles.syncBadgePending : styles.syncBadgeSynced,
              ]}
            >
              <Text
                style={[
                  styles.syncBadgeText,
                  pendingSyncCount > 0 ? styles.syncTextPending : styles.syncTextSynced,
                ]}
              >
                {pendingSyncCount > 0 ? `${pendingSyncCount} offline changes` : 'Fully Synced'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionSubtitle}>
            Your shop ledger is backed up automatically. Even if this phone is lost, your records
            can be restored using your verified phone number.
          </Text>

          <View style={styles.syncMetaRow}>
            <Text style={styles.syncMetaText}>Last synced: {lastSyncedText}</Text>
            <TouchableOpacity
              style={[styles.syncNowBtn, syncing && styles.btnDisabled]}
              onPress={handleManualSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#0B0F19" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color="#0B0F19" />
                  <Text style={styles.syncNowText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Business Preferences</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setIsEditModalOpen(true)}
          >
            <View style={styles.settingIconWrapper}>
              <Ionicons name="cash-outline" size={20} color={COLORS.textPrimary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Currency</Text>
              <Text style={styles.settingSub}>{profile?.currency || 'MWK'} (Malawian Kwacha)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setIsEditModalOpen(true)}
          >
            <View style={styles.settingIconWrapper}>
              <Ionicons name="storefront-outline" size={20} color={COLORS.textPrimary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Shop Name</Text>
              <Text style={styles.settingSub}>{profile?.name || 'Not set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Security & Sign Out */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutIconWrapper}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.cashOut} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.logoutLabel}>Sign Out / Switch Shop</Text>
              <Text style={styles.settingSub}>Disconnect account from this device</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.cashOut} />
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.appFooter}>
          <Text style={styles.appFooterText}>Glegder Mobile v1.0.0 (Malawi Retail Edition)</Text>
          <Text style={styles.appFooterSub}>SMS OTP Powered by TelcoMW Gateway</Text>
        </View>
      </ScrollView>

      {/* Edit Shop Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shop Details</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>SHOP NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter shop name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>CURRENCY SYMBOL</Text>
              <TextInput
                style={styles.modalInput}
                value={editCurrency}
                onChangeText={setEditCurrency}
                placeholder="e.g. MWK"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveModalBtn, isSaving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#0B0F19" />
              ) : (
                <Text style={styles.saveModalBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  shopCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  shopCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  shopMeta: {
    flex: 1,
  },
  shopNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  operatorTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  operatorTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  metricsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: 8,
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeSynced: {
    backgroundColor: COLORS.cashInBg,
  },
  syncBadgePending: {
    backgroundColor: COLORS.warningBg,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncTextSynced: {
    color: COLORS.cashIn,
  },
  syncTextPending: {
    color: COLORS.warning,
  },
  syncMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  syncMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  syncNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F19',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cashOutBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cashOut,
  },
  appFooter: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  appFooterText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  appFooterSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  modalInput: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    height: 50,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  saveModalBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B0F19',
  },
});
