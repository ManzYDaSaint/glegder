import React, { useState } from 'react';
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { CustomerDebtRecord } from '../db';
import { formatMWK } from '../utils/format';

interface CollectDebtModalProps {
  visible: boolean;
  activeDebts: CustomerDebtRecord[];
  onClose: () => void;
  onSubmit: (customerId: string, amount: number, note?: string) => void;
}

export default function CollectDebtModal({
  visible,
  activeDebts,
  onClose,
  onSubmit,
}: CollectDebtModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const selectedCustomer = activeDebts.find((d) => d.customerId === selectedCustomerId);

  const handleSelectCustomer = (debt: CustomerDebtRecord) => {
    setSelectedCustomerId(debt.customerId);
    setAmount(debt.balanceOwed.toString()); // pre-fill with total owed
    setError('');
  };

  const handleSave = () => {
    if (!selectedCustomerId || !selectedCustomer) {
      setError('Please select a customer first');
      return;
    }

    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onSubmit(selectedCustomerId, num, note.trim() || undefined);

    // Reset
    setSelectedCustomerId(null);
    setAmount('');
    setNote('');
    setError('');
    onClose();
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
                <Text style={styles.modalTitle}>Record Debt Payment</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle-outline" size={28} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Customer picker */}
            <Text style={styles.fieldLabel}>SELECT CUSTOMER PAYING</Text>
            {activeDebts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No customers currently owe money.</Text>
              </View>
            ) : (
              <View style={styles.customerListWrap}>
                <FlatList
                  data={activeDebts}
                  keyExtractor={(item) => item.customerId}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = selectedCustomerId === item.customerId;
                    return (
                      <TouchableOpacity
                        style={[styles.customerChip, isSelected && styles.customerChipActive]}
                        onPress={() => handleSelectCustomer(item)}
                      >
                        <Text style={[styles.customerName, isSelected && styles.customerNameActive]}>
                          {item.customerName}
                        </Text>
                        <Text style={[styles.customerOwed, isSelected && styles.customerOwedActive]}>
                          Owes {formatMWK(item.balanceOwed)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* Step 2: Payment Amount */}
            {selectedCustomer && (
              <>
                <Text style={styles.fieldLabel}>AMOUNT PAID (MWK)</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencyPrefix}>MWK</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={(t) => {
                      setAmount(t);
                      if (error) setError('');
                    }}
                  />
                </View>

                {/* Quick Full Pay Button */}
                <TouchableOpacity
                  style={styles.fullPayBtn}
                  onPress={() => setAmount(selectedCustomer.balanceOwed.toString())}
                >
                  <Ionicons name="flash-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.fullPayText}>
                    Pay Full Balance ({formatMWK(selectedCustomer.balanceOwed)})
                  </Text>
                </TouchableOpacity>

                {/* Optional note */}
                <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Paid in cash, Airtel Money..."
                  placeholderTextColor={COLORS.textMuted}
                  value={note}
                  onChangeText={setNote}
                />
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                !selectedCustomerId && { backgroundColor: COLORS.borderLight, opacity: 0.6 },
              ]}
              disabled={!selectedCustomerId}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>Confirm Payment & Add to Till</Text>
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
    marginBottom: 16,
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
    backgroundColor: COLORS.primary,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  emptyState: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  customerListWrap: {
    marginBottom: 10,
  },
  customerChip: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  customerChipActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  customerName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  customerNameActive: {
    color: COLORS.primaryLight,
  },
  customerOwed: {
    color: COLORS.warning,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  customerOwedActive: {
    color: COLORS.primaryLight,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyPrefix: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: '700',
    marginRight: 10,
  },
  amountInput: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'left',
  },
  fullPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  fullPayText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 14,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.cashOut,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
