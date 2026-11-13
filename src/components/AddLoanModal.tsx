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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    amount: number;
    due_date: string;
    note?: string;
  }) => void;
}

export default function AddLoanModal({ visible, onClose, onSubmit }: AddLoanModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDays, setDueDays] = useState(7); // default 7 days from now
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const calculateDueDate = (daysAhead: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const handleSave = () => {
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please enter phone number');
      return;
    }
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid loan amount');
      return;
    }

    const due_date = calculateDueDate(dueDays);

    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      amount: num,
      due_date,
      note: note.trim() || undefined,
    });

    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setAmount('');
    setDueDays(7);
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
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.typeDot} />
                  <Text style={styles.modalTitle}>Give Credit / Loan In</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle-outline" size={28} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
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
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Customer Name */}
              <Text style={styles.fieldLabel}>CUSTOMER NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. John Banda"
                placeholderTextColor={COLORS.textMuted}
                value={customerName}
                onChangeText={(t) => {
                  setCustomerName(t);
                  if (error) setError('');
                }}
              />

              {/* Customer Phone */}
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0991234567"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={(t) => {
                  setCustomerPhone(t);
                  if (error) setError('');
                }}
              />

              {/* Due Date Presets */}
              <Text style={styles.fieldLabel}>PAYMENT DUE IN</Text>
              <View style={styles.duePresetsRow}>
                {[
                  { label: 'Tomorrow (1d)', days: 1 },
                  { label: '3 Days', days: 3 },
                  { label: '1 Week (7d)', days: 7 },
                  { label: '2 Weeks (14d)', days: 14 },
                  { label: '1 Month (30d)', days: 30 },
                ].map((item) => {
                  const isSelected = dueDays === item.days;
                  return (
                    <TouchableOpacity
                      key={item.days}
                      style={[styles.dueChip, isSelected && styles.dueChipActive]}
                      onPress={() => setDueDays(item.days)}
                    >
                      <Text style={[styles.dueChipText, isSelected && styles.dueChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional Note / Items taken */}
              <Text style={styles.fieldLabel}>ITEMS TAKEN ON CREDIT (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2kg Sugar, 1 bottle cooking oil"
                placeholderTextColor={COLORS.textMuted}
                value={note}
                onChangeText={setNote}
              />

              {/* Submit */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveButtonText}>Record Customer Loan</Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '90%',
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
    marginBottom: 18,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  currencyPrefix: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: '700',
    marginRight: 10,
  },
  amountInput: {
    color: COLORS.warning,
    fontSize: 32,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'left',
  },
  errorText: {
    color: COLORS.cashOut,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 14,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  duePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dueChip: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dueChipActive: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warning,
  },
  dueChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dueChipTextActive: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: COLORS.warning,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
