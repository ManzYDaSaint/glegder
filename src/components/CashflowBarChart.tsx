import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { formatMWK } from '../utils/format';

interface CashflowBarChartProps {
  totalIn: number;
  totalOut: number;
  totalOwed: number;
}

export default function CashflowBarChart({
  totalIn,
  totalOut,
  totalOwed,
}: CashflowBarChartProps) {
  const maxVal = Math.max(totalIn, totalOut, totalOwed, 1);

  const inPct = Math.round((totalIn / maxVal) * 100);
  const outPct = Math.round((totalOut / maxVal) * 100);
  const owedPct = Math.round((totalOwed / maxVal) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>CASH DISTRIBUTION</Text>

      {/* Row 1: Money In */}
      <View style={styles.barItem}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>Money In (Sales)</Text>
          <Text style={[styles.barAmount, { color: COLORS.cashIn }]}>{formatMWK(totalIn)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(inPct, 4)}%`, backgroundColor: COLORS.cashIn },
            ]}
          />
        </View>
      </View>

      {/* Row 2: Money Out */}
      <View style={styles.barItem}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>Money Out (Expenses)</Text>
          <Text style={[styles.barAmount, { color: COLORS.cashOut }]}>{formatMWK(totalOut)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(outPct, 4)}%`, backgroundColor: COLORS.cashOut },
            ]}
          />
        </View>
      </View>

      {/* Row 3: Credit Owed */}
      <View style={styles.barItem}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>Customer Credit Owed</Text>
          <Text style={[styles.barAmount, { color: COLORS.warning }]}>{formatMWK(totalOwed)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(owedPct, 4)}%`, backgroundColor: COLORS.warning },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  chartTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  barItem: {
    marginBottom: 14,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  barAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    height: 10,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
});
