import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAppDatabase } from '../../context/DatabaseContext';
import { formatMWK, formatShortDate } from '../../utils/format';
import AddTransactionModal from '../../components/AddTransactionModal';
import SyncStatusBadge from '../../components/SyncStatusBadge';
import { TransactionType } from '../../types';

export default function DailyCashScreen() {
  const { cashSummary, recentTransactions, addTransaction } = useAppDatabase();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('IN');

  const openModal = (type: TransactionType) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleTransactionSubmit = async (data: {
    type: TransactionType;
    amount: number;
    category: string;
    note?: string;
  }) => {
    try {
      await addTransaction(data);
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MY SHOP TILL</Text>
          <Text style={styles.headerTitle}>Daily Cash</Text>
        </View>
        <SyncStatusBadge />
      </View>

      {/* Hero Till Balance Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Cash in Hand (Till)</Text>
        <Text style={[styles.heroAmount, cashSummary.balance < 0 && { color: COLORS.cashOut }]}>
          {formatMWK(cashSummary.balance)}
        </Text>
        <View style={styles.todayPill}>
          <Text style={styles.todayText}>
            Today: {cashSummary.todayBalance >= 0 ? '+' : ''}
            {formatMWK(cashSummary.todayBalance)}
          </Text>
        </View>
      </View>

      {/* Dead Simple 2-Button HUD */}
      <View style={styles.hudSection}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {/* 1. Cash In */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.cashInBtn]}
            activeOpacity={0.8}
            onPress={() => openModal('IN')}
          >
            <View style={styles.iconCircleIn}>
              <Ionicons name="arrow-down-outline" size={24} color={COLORS.cashIn} />
            </View>
            <Text style={styles.btnLabel}>+ Cash In</Text>
            <Text style={styles.btnSub}>Sales & money in</Text>
          </TouchableOpacity>

          {/* 2. Cash Out */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.cashOutBtn]}
            activeOpacity={0.8}
            onPress={() => openModal('OUT')}
          >
            <View style={styles.iconCircleOut}>
              <Ionicons name="arrow-up-outline" size={24} color={COLORS.cashOut} />
            </View>
            <Text style={styles.btnLabel}>- Cash Out</Text>
            <Text style={styles.btnSub}>Expenses & stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions Feed */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>

        <FlatList
          data={recentTransactions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isCashIn = item.type === 'IN';
            return (
              <View style={styles.txRow}>
                <View
                  style={[
                    styles.txIconWrap,
                    { backgroundColor: isCashIn ? COLORS.cashInBg : COLORS.cashOutBg },
                  ]}
                >
                  <Ionicons
                    name={isCashIn ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={isCashIn ? COLORS.cashIn : COLORS.cashOut}
                  />
                </View>

                <View style={styles.txDetails}>
                  <Text style={styles.txCategory}>{item.category}</Text>
                  {item.note ? (
                    <Text style={styles.txNote} numberOfLines={1}>
                      {item.note}
                    </Text>
                  ) : null}
                  <Text style={styles.txTime}>{formatShortDate(item.created_at)}</Text>
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    { color: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                  ]}
                >
                  {isCashIn ? '+' : '-'}
                  {formatMWK(item.amount)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySub}>
                Tap '+ Cash In' or '- Cash Out' above to log your first record.
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Modal */}
      <AddTransactionModal
        visible={modalVisible}
        type={modalType}
        onClose={() => setModalVisible(false)}
        onSubmit={handleTransactionSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 18,
  },
  headerSubtitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  offlineText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  heroAmount: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
  },
  todayPill: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  todayText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  hudSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  cashInBtn: {
    backgroundColor: COLORS.cashInBg,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  cashOutBtn: {
    backgroundColor: COLORS.cashOutBg,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  iconCircleIn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircleOut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnLabel: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  btnSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  activitySection: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txCategory: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  txNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  txTime: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
