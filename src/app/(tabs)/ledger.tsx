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
import { formatMWK } from '../../utils/format';
import AddLoanModal from '../../components/AddLoanModal';
import CollectDebtModal from '../../components/CollectDebtModal';

export default function LedgerScreen() {
  const { debtSummary, activeDebts, addLoan, collectDebt } = useAppDatabase();
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);

  const handleAddLoan = async (data: {
    customerName: string;
    customerPhone: string;
    amount: number;
    due_date: string;
    note?: string;
  }) => {
    try {
      await addLoan(data);
    } catch {
      Alert.alert('Error', 'Failed to record loan');
    }
  };

  const handleCollectDebt = async (customerId: string, amount: number, note?: string) => {
    try {
      await collectDebt(customerId, amount, note);
    } catch {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const hasUrgentDebts = debtSummary.dueTodayCount > 0 || debtSummary.overdueCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>CREDIT BOOK</Text>
          <Text style={styles.headerTitle}>Ledger HUD</Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterBadgeText}>{activeDebts.length} Active</Text>
        </View>
      </View>

      {/* In-App Debt Alert Banner (No SMS / No AI - Clean Local Alert Engine) */}
      {hasUrgentDebts ? (
        <View
          style={[
            styles.alertBanner,
            debtSummary.overdueCount > 0 ? styles.alertBannerOverdue : styles.alertBannerDueToday,
          ]}
        >
          <View
            style={[
              styles.alertIconCircle,
              debtSummary.overdueCount > 0 ? styles.iconCircleOverdue : styles.iconCircleDueToday,
            ]}
          >
            <Ionicons
              name={debtSummary.overdueCount > 0 ? 'alert' : 'notifications'}
              size={20}
              color={debtSummary.overdueCount > 0 ? COLORS.cashOut : COLORS.warning}
            />
          </View>
          <View style={styles.alertContent}>
            <Text
              style={[
                styles.alertTitle,
                debtSummary.overdueCount > 0 ? { color: COLORS.cashOut } : { color: COLORS.warning },
              ]}
            >
              {debtSummary.overdueCount > 0
                ? `${debtSummary.overdueCount} Overdue Loan(s) Detected!`
                : `${debtSummary.dueTodayCount} Debt(s) Due Today!`}
            </Text>
            <Text style={styles.alertSub}>
              {debtSummary.overdueCount > 0
                ? 'Check customer cards below and arrange collection today.'
                : 'Remind your customers to settle their balance as agreed.'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.alertBannerCalm}>
          <View style={styles.iconCircleCalm}>
            <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitleCalm}>All Due Dates in Order</Text>
            <Text style={styles.alertSub}>No customer payments due today.</Text>
          </View>
        </View>
      )}

      {/* Hero Card: Total Customer Debts */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Money Owed to You</Text>
        <Text style={styles.heroAmount}>{formatMWK(debtSummary.totalOwed)}</Text>
        <Text style={styles.debtSub}>
          Across {activeDebts.length} customer{activeDebts.length === 1 ? '' : 's'}
        </Text>
      </View>

      {/* 2 Big Action Buttons */}
      <View style={styles.hudSection}>
        <Text style={styles.sectionTitle}>LEDGER ACTIONS</Text>
        <View style={styles.actionsRow}>
          {/* Button 1: Loan In (Give credit) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.loanInBtn]}
            activeOpacity={0.8}
            onPress={() => setShowAddLoanModal(true)}
          >
            <View style={styles.iconCircleLoan}>
              <Ionicons name="person-add-outline" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.btnLabel}>+ Loan In</Text>
            <Text style={styles.btnSub}>Give credit to customer</Text>
          </TouchableOpacity>

          {/* Button 2: Loan Paid (Collect payback) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.loanPaidBtn]}
            activeOpacity={0.8}
            onPress={() => setShowCollectModal(true)}
          >
            <View style={styles.iconCirclePaid}>
              <Ionicons name="checkmark-done-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.btnLabel}>✓ Loan Paid</Text>
            <Text style={styles.btnSub}>Record collection to till</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer debt list */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>ACTIVE CUSTOMER DEBTS</Text>

        <FlatList
          data={activeDebts}
          keyExtractor={(item) => item.customerId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View
              style={[
                styles.debtCard,
                item.isOverdue && styles.debtCardOverdue,
                item.isDueToday && styles.debtCardDueToday,
              ]}
            >
              <View style={styles.debtCardHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.customerPhone}>📞 {item.customerPhone}</Text>
                </View>

                {item.isOverdue ? (
                  <View style={styles.badgeOverdue}>
                    <Text style={styles.badgeOverdueText}>OVERDUE</Text>
                  </View>
                ) : item.isDueToday ? (
                  <View style={styles.badgeDueToday}>
                    <Text style={styles.badgeDueTodayText}>DUE TODAY</Text>
                  </View>
                ) : (
                  <View style={styles.badgePending}>
                    <Text style={styles.badgePendingText}>Due {item.nextDueDate}</Text>
                  </View>
                )}
              </View>

              <View style={styles.debtCardFooter}>
                <View>
                  <Text style={styles.owedLabel}>Outstanding Balance</Text>
                  <Text style={styles.owedAmount}>{formatMWK(item.balanceOwed)}</Text>
                </View>

                {/* Instant Collect Button for this debtor */}
                <TouchableOpacity
                  style={styles.quickPayBtn}
                  onPress={() => {
                    setShowCollectModal(true);
                  }}
                >
                  <Text style={styles.quickPayBtnText}>Collect</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primaryLight} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="shield-checkmark-outline" size={38} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>Zero Outstanding Debts!</Text>
              <Text style={styles.emptySub}>
                Every customer credit has been settled. Tap '+ Loan In' when giving goods on credit.
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={showAddLoanModal}
        onClose={() => setShowAddLoanModal(false)}
        onSubmit={handleAddLoan}
      />

      {/* Collect Modal */}
      <CollectDebtModal
        visible={showCollectModal}
        activeDebts={activeDebts}
        onClose={() => setShowCollectModal(false)}
        onSubmit={handleCollectDebt}
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
    marginBottom: 14,
  },
  headerSubtitle: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  counterBadge: {
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertBannerOverdue: {
    backgroundColor: COLORS.cashOutBg,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertBannerDueToday: {
    backgroundColor: COLORS.warningBg,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  alertBannerCalm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  iconCircleDueToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  iconCircleCalm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  alertTitleCalm: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  alertSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 22,
    padding: 20,
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
    color: COLORS.warning,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  debtSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
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
  loanInBtn: {
    backgroundColor: COLORS.warningBg,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  loanPaidBtn: {
    backgroundColor: COLORS.cashInBg,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  iconCircleLoan: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCirclePaid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
  listSection: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
  },
  debtCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  debtCardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  debtCardDueToday: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  debtCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  customerPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badgeOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cashOut,
  },
  badgeOverdueText: {
    color: COLORS.cashOut,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeDueToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  badgeDueTodayText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePending: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgePendingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  debtCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  owedLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  owedAmount: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  quickPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  quickPayBtnText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
