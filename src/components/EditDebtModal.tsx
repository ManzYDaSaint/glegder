import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { CustomerDebtRecord } from '../db';
import { formatMWK } from '../utils/format';

interface EditDebtModalProps {
  visible: boolean;
  debt: CustomerDebtRecord | null;
  onClose: () => void;
  onDeleteCustomer: (customerId: string) => void;
}

export default function EditDebtModal({
  visible,
  debt,
  onClose,
  onDeleteCustomer,
}: EditDebtModalProps) {
  if (!debt) return null;

  const confirmDelete = () => {
    Alert.alert(
      'Delete Customer & Debt',
      `Are you sure you want to completely remove ${debt.customerName} and their outstanding balance of ${formatMWK(debt.balanceOwed)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Debt',
          style: 'destructive',
          onPress: () => {
            onDeleteCustomer(debt.customerId);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.typeDot} />
                <Text style={styles.modalTitle}>Customer Debt Record</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle-outline" size={28} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Customer Overview Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.customerName}>{debt.customerName}</Text>
              <Text style={styles.customerPhone}>📞 {debt.customerPhone}</Text>

              <View style={styles.divider} />

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Credit Given</Text>
                  <Text style={styles.metricVal}>{formatMWK(debt.totalGiven)}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Repaid</Text>
                  <Text style={[styles.metricVal, { color: COLORS.cashIn }]}>
                    {formatMWK(debt.totalRepaid)}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Balance Owed</Text>
                  <Text style={[styles.metricVal, { color: COLORS.warning }]}>
                    {formatMWK(debt.balanceOwed)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delete / Void Debt Option */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.cashOut} style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>Delete / Void Customer Debt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.warning,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  customerName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  customerPhone: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricVal: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.cashOutBg,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: COLORS.cashOut,
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.bgCardHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  closeBtnText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
