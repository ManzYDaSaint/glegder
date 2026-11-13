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
import { Transaction } from '../types';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, updates: { amount: number; category: string; note?: string }) => void;
  onDelete: (id: string) => void;
}

const IN_CATEGORIES = ['Goods Sale', 'Services', 'Owner Capital', 'Other In', 'Loan Repayment'];
const OUT_CATEGORIES = ['Stock Purchase', 'Transport', 'Shop Bills', 'Personal/Drawing', 'Other Out'];

export default function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete,
}: EditTransactionModalProps) {
  if (!transaction) return null;

  const isCashIn = transaction.type === 'IN';
  const categories = isCashIn ? IN_CATEGORIES : OUT_CATEGORIES;

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setNote(transaction.note || '');
      setError('');
    }
  }, [transaction]);

  const handleSave = () => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onSave(transaction.id, {
      amount: num,
      category,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to remove this record? This will adjust your till balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(transaction.id);
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
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                  ]}
                />
                <Text style={styles.modalTitle}>Edit Transaction</Text>
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
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (error) setError('');
                }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

            {/* Note */}
            <Text style={styles.fieldLabel}>NOTE</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Bread delivery, Sugar sale..."
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.cashOut} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: isCashIn ? COLORS.cashIn : COLORS.cashOut },
                ]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.cashOutBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
