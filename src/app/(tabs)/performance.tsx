import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useAppDatabase } from '../../context/DatabaseContext';
import { formatMWK } from '../../utils/format';
import CashflowBarChart from '../../components/CashflowBarChart';

export default function PerformanceScreen() {
  const { cashSummary, debtSummary } = useAppDatabase();

  const totalIn = cashSummary.totalIn;
  const totalOut = cashSummary.totalOut;
  const totalOwed = debtSummary.totalOwed;
  const netProfit = totalIn - totalOut;

  // Algorithmic Business Health Status (Deterministic, No Hallucinations)
  let healthStatus: 'PROFIT' | 'CAUTION' | 'LOSS' = 'PROFIT';
  let statusTitle = 'Business is Profitable & In The Green!';
  let statusDescription = 'Money coming in exceeds your shop expenses. Maintain this momentum!';
  let statusColor = COLORS.primaryLight;
  let statusBg = COLORS.primaryGlow;
  let statusIcon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

  if (totalIn === 0 && totalOut === 0) {
    statusTitle = 'Awaiting Initial Shop Records';
    statusDescription = 'Start recording sales and expenses on the Daily Cash tab to see financial health.';
    statusColor = COLORS.textSecondary;
    statusBg = COLORS.bgSecondary;
    statusIcon = 'information-circle-outline';
  } else if (netProfit < 0) {
    healthStatus = 'LOSS';
    statusTitle = 'Operating at a Cashflow Deficit';
    statusDescription = 'Expenses currently exceed sales. Cut non-essential shop costs and boost sales volume.';
    statusColor = COLORS.cashOut;
    statusBg = COLORS.cashOutBg;
    statusIcon = 'alert-circle';
  } else if (totalOwed > totalIn * 0.4 && totalOwed > 0) {
    healthStatus = 'CAUTION';
    statusTitle = 'Caution: High Capital Locked in Debts';
    statusDescription = 'Over 40% of your earnings are held up by customers. Focus on collecting outstanding loans.';
    statusColor = COLORS.warning;
    statusBg = COLORS.warningBg;
    statusIcon = 'warning';
  }

  // Dynamic Rule-Based Improvement Hints
  const hints = [];

  if (debtSummary.overdueCount > 0) {
    hints.push({
      id: 'overdue_hint',
      icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: COLORS.cashOut,
      title: `${debtSummary.overdueCount} Overdue Loans Require Follow-up`,
      text: 'Debts lose recovery probability the longer they stay overdue. Check Ledger HUD today.',
    });
  }

  if (totalOwed > 0) {
    hints.push({
      id: 'credit_limit',
      icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: COLORS.warning,
      title: 'Set Customer Credit Caps',
      text: 'Limit individual customer credit to prevent heavy losses if a customer delays payment.',
    });
  }

  if (totalOut > 0 && totalIn > 0 && totalOut / totalIn > 0.8) {
    hints.push({
      id: 'margin_hint',
      icon: 'trending-down-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: COLORS.warning,
      title: 'Operating Costs Are High (>80% of sales)',
      text: 'Inspect transport and restocking costs to retain more take-home profit each week.',
    });
  }

  // Default best practice hints
  hints.push({
    id: 'stock_tip',
    icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
    iconColor: COLORS.primary,
    title: 'Restock Fast-Moving Essentials',
    text: 'Keep track of fast-selling items (sugar, cooking oil, soap) to avoid running out on peak days.',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>FINANCIAL HEALTH</Text>
          <Text style={styles.headerTitle}>Performance</Text>
        </View>

        {/* Health Status Card */}
        <View style={[styles.statusCard, { borderColor: statusColor }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Ionicons name={statusIcon} size={18} color={statusColor} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {healthStatus === 'PROFIT' ? 'HEALTHY CASHFLOW' : healthStatus === 'CAUTION' ? 'ATTENTION NEEDED' : 'DEFICIT'}
            </Text>
          </View>
          <Text style={styles.statusHeading}>{statusTitle}</Text>
          <Text style={styles.statusDescription}>{statusDescription}</Text>
        </View>

        {/* Visual Cashflow Distribution Bar Chart */}
        <CashflowBarChart
          totalIn={totalIn}
          totalOut={totalOut}
          totalOwed={totalOwed}
        />

        {/* 4-Metric Grid */}
        <Text style={styles.sectionTitle}>BUSINESS BALANCE SHEET</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Money In</Text>
            <Text style={[styles.metricValue, { color: COLORS.cashIn }]}>{formatMWK(totalIn)}</Text>
            <Text style={styles.metricSub}>Recorded sales</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Money Out</Text>
            <Text style={[styles.metricValue, { color: COLORS.cashOut }]}>{formatMWK(totalOut)}</Text>
            <Text style={styles.metricSub}>Shop expenses</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Customer Credit</Text>
            <Text style={[styles.metricValue, { color: COLORS.warning }]}>{formatMWK(totalOwed)}</Text>
            <Text style={styles.metricSub}>Owed by {debtSummary.customerCount} customers</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Net Cash Profit</Text>
            <Text
              style={[
                styles.metricValue,
                { color: netProfit >= 0 ? COLORS.primaryLight : COLORS.cashOut },
              ]}
            >
              {netProfit >= 0 ? '+' : ''}
              {formatMWK(netProfit)}
            </Text>
            <Text style={styles.metricSub}>Till margin</Text>
          </View>
        </View>

        {/* Rule-based Improvement Hints */}
        <Text style={styles.sectionTitle}>TIPS FOR BUSINESS IMPROVEMENT</Text>
        {hints.map((hint) => (
          <View key={hint.id} style={styles.hintCard}>
            <View style={[styles.hintIconCircle, { backgroundColor: COLORS.bgCardHover }]}>
              <Ionicons name={hint.icon} size={22} color={hint.iconColor} />
            </View>
            <View style={styles.hintContent}>
              <Text style={styles.hintTitle}>{hint.title}</Text>
              <Text style={styles.hintText}>{hint.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
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
  statusCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusHeading: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  hintCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hintIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  hintContent: {
    flex: 1,
  },
  hintTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
