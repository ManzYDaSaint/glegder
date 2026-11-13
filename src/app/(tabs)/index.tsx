import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAppDatabase } from '../../context/DatabaseContext';
import { formatMWK, formatShortDate } from '../../utils/format';
import AddTransactionModal from '../../components/AddTransactionModal';
import EditTransactionModal from '../../components/EditTransactionModal';
import SyncStatusBadge from '../../components/SyncStatusBadge';
import { Transaction, TransactionType } from '../../types';

export default function DailyCashScreen() {
  const {
    cashSummary,
    recentTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
  } = useAppDatabase();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('IN');
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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

      {/* Redesigned Modern Glass-Fintech Till Card */}
      <View style={styles.heroCard}>
        {/* Top Row: Active Till pill & Eye toggle */}
        <View style={styles.heroTopRow}>
          <View style={styles.activePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.activePillText}>Active Till</Text>
          </View>
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowBalance(!showBalance)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showBalance ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.heroAmountWrap}>
          <Text style={styles.heroAmountLabel}>Total Cash in Hand</Text>
          <Text
            style={[
              styles.heroAmount,
              cashSummary.balance < 0 && { color: COLORS.cashOut },
            ]}
          >
            {showBalance ? formatMWK(cashSummary.balance) : 'MWK ••••••'}
          </Text>
        </View> 

        {/* Bottom Split Sub-Card: Today's Pulse */}
        <View style={styles.todayPulseContainer}>
          <View style={styles.pulseItem}>
            <View style={styles.pulseIconIn}>
              <Ionicons name="arrow-down" size={13} color={COLORS.cashIn} />
            </View>
            <View>
              <Text style={styles.pulseAmountIn}>
                {showBalance ? `+${formatMWK(cashSummary.todayIn)}` : '••••'}
              </Text>
              <Text style={styles.pulseLabel}>Today In</Text>
            </View>
          </View>

          <View style={styles.pulseDivider} />

          <View style={styles.pulseItem}>
            <View style={styles.pulseIconOut}>
              <Ionicons name="arrow-up" size={13} color={COLORS.cashOut} />
            </View>
            <View>
              <Text style={styles.pulseAmountOut}>
                {showBalance ? `-${formatMWK(cashSummary.todayOut)}` : '••••'}
              </Text>
              <Text style={styles.pulseLabel}>Today Out</Text>
            </View>
          </View>
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
              <TouchableOpacity
                style={styles.txRow}
                activeOpacity={0.7}
                onPress={() => setSelectedTx(item)}
              >
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

                <View style={styles.amountTrailing}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                    ]}
                  >
                    {isCashIn ? '+' : '-'}
                    {formatMWK(item.amount)}
                  </Text>
                  <Ionicons name="ellipsis-vertical" size={14} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                </View>
              </TouchableOpacity>
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

      {/* Edit / Delete Modal */}
      <EditTransactionModal
        visible={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onSave={async (id, updates) => {
          try {
            await editTransaction(id, updates);
          } catch {
            Alert.alert('Error', 'Failed to update transaction');
          }
        }}
        onDelete={async (id) => {
          try {
            await removeTransaction(id);
          } catch {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        }}
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  activePillText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eyeBtn: {
    backgroundColor: COLORS.bgCardHover,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroAmountWrap: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  heroAmountLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroAmount: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  todayPulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pulseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  pulseIconIn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cashInBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseIconOut: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cashOutBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseAmountIn: {
    color: COLORS.cashIn,
    fontSize: 13,
    fontWeight: '800',
  },
  pulseAmountOut: {
    color: COLORS.cashOut,
    fontSize: 13,
    fontWeight: '800',
  },
  pulseLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
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
  amountTrailing: {
    alignItems: 'flex-end',
    gap: 4,
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
