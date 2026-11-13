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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { TransactionType } from '../types';

interface AddTransactionModalProps {
  visible: boolean;
  type: TransactionType;
  onClose: () => void;
  onSubmit: (data: { type: TransactionType; amount: number; category: string; note?: string }) => void;
}

const IN_CATEGORIES = ['Goods Sale', 'Services', 'Owner Capital', 'Other In'];
const OUT_CATEGORIES = ['Stock Purchase', 'Transport', 'Shop Bills', 'Personal/Drawing', 'Other Out'];

export default function AddTransactionModal({
  visible,
  type,
  onClose,
  onSubmit,
}: AddTransactionModalProps) {
  const isCashIn = type === 'IN';
  const categories = isCashIn ? IN_CATEGORIES : OUT_CATEGORIES;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onSubmit({
      type,
      amount: num,
      category,
      note: note.trim() || undefined,
    });

    // Reset & close
    setAmount('');
    setNote('');
    setError('');
    onClose();
  };

  const handleQuickAdd = (addVal: number) => {
    const current = parseFloat(amount.replace(/,/g, '')) || 0;
    setAmount((current + addVal).toString());
    setError('');
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
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                  ]}
                />
                <Text style={styles.modalTitle}>
                  {isCashIn ? 'Record Cash In' : 'Record Cash Out'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle-outline" size={28} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>MWK</Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                ]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                autoFocus
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (error) setError('');
                }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Quick Amount Chips */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2000, 5000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickChip}
                  onPress={() => handleQuickAdd(val)}
                >
                  <Text style={styles.quickChipText}>+{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>CATEGORY / REASON</Text>
            <View style={styles.categoriesRow}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryTag,
                      isSelected && {
                        backgroundColor: isCashIn ? COLORS.cashInBg : COLORS.cashOutBg,
                        borderColor: isCashIn ? COLORS.cashIn : COLORS.cashOut,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryTagText,
                        isSelected && {
                          color: isCashIn ? COLORS.cashIn : COLORS.cashOut,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Note */}
            <Text style={styles.fieldLabel}>OPTIONAL NOTE</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Bread delivery, Sugar sale..."
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: isCashIn ? COLORS.cashIn : COLORS.cashOut },
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {isCashIn ? 'Save Cash In' : 'Save Cash Out'}
              </Text>
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
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 18,
    paddingVertical: 14,
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
    fontSize: 32,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'left',
  },
  errorText: {
    color: COLORS.cashOut,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 14,
  },
  quickChip: {
    backgroundColor: COLORS.bgCardHover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryTagText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 14,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
