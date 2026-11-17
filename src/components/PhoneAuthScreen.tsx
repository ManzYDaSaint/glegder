import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import {
  normalizeMalawiPhone,
  isValidMalawiPhone,
  generateOtp,
  sendOtpViaTelcomw,
} from '../services/smsService';
import { registerOrFetchShopCloud } from '../services/syncService';
import { ShopProfile } from '../types';

interface PhoneAuthScreenProps {
  onSuccess: (profile: ShopProfile) => void;
  onBack?: () => void;
}

export default function PhoneAuthScreen({ onSuccess, onBack }: PhoneAuthScreenProps) {
  // Step: 'ENTER_PHONE' | 'VERIFY_OTP'
  const [step, setStep] = useState<'ENTER_PHONE' | 'VERIFY_OTP'>('ENTER_PHONE');

  // Input states
  const [shopName, setShopName] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Generated OTP & expiry
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<any>(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Operator badge helper
  const getOperator = (phone: string) => {
    const norm = normalizeMalawiPhone(phone);
    if (norm.startsWith('2658')) return 'TNM';
    if (norm.startsWith('2659')) return 'Airtel';
    return null;
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedName = shopName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter your Shop or Business Name');
      return;
    }

    if (!isValidMalawiPhone(rawPhone)) {
      setErrorMsg('Please enter a valid 9-digit Malawian number (e.g. 088... or 099...)');
      return;
    }

    const normalized = normalizeMalawiPhone(rawPhone);
    const code = generateOtp();

    setLoading(true);
    const result = await sendOtpViaTelcomw(normalized, code);
    setLoading(false);

    if (result.success || result.simulated) {
      setGeneratedOtp(code);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes validity
      setResendCooldown(60);
      setStep('VERIFY_OTP');
      if (result.simulated && result.message) {
        setInfoMsg(result.message);
      }
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    } else {
      setErrorMsg(result.message || 'Failed to send SMS code. Please check connection.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);

    if (otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the full 6-digit code');
      return;
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setErrorMsg('This verification code has expired. Tap "Resend SMS".');
      return;
    }

    if (otpCode.trim() !== generatedOtp) {
      setErrorMsg('Incorrect verification code. Please check your SMS and try again.');
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeMalawiPhone(rawPhone);
      const profile = await registerOrFetchShopCloud(normalized, shopName.trim());
      setLoading(false);
      onSuccess(profile);
    } catch (e: any) {
      setLoading(false);
      setErrorMsg('Could not complete shop registration. Please try again.');
    }
  };

  const operator = getOperator(rawPhone);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            {onBack && step === 'ENTER_PHONE' && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            {step === 'VERIFY_OTP' && (
              <TouchableOpacity
                onPress={() => {
                  setStep('ENTER_PHONE');
                  setErrorMsg(null);
                }}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.titleBadge}>
              <Ionicons name="storefront" size={20} color={COLORS.primary} />
              <Text style={styles.titleBadgeText}>SHOP REGISTRATION</Text>
            </View>
          </View>

          {step === 'ENTER_PHONE' ? (
            <View style={styles.card}>
              <View style={styles.cardBrandRow}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.cardBrandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.cardBrandTitle}>Glegder</Text>
              </View>
              <Text style={styles.heading}>Connect Your Shop</Text>
              <Text style={styles.subtitle}>
                Register your business phone to link your offline books with secure cloud backup.
              </Text>

              {/* Shop Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SHOP / GROCERY NAME</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Chikondi Grocery & Cold Drinks"
                    placeholderTextColor={COLORS.textMuted}
                    value={shopName}
                    onChangeText={setShopName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone Number Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>SHOP OWNER PHONE NUMBER</Text>
                  {operator && (
                    <View style={styles.operatorBadge}>
                      <Text style={styles.operatorText}>{operator}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇲🇼 +265</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="881 234 567"
                    placeholderTextColor={COLORS.textMuted}
                    value={rawPhone}
                    onChangeText={setRawPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.helperText}>
                  We will send a fast, one-time verification code via SMS.
                </Text>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.cashOut} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0B0F19" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Send SMS Code</Text>
                    <Ionicons name="arrow-forward" size={18} color="#0B0F19" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.heading}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{' '}
                <Text style={styles.phoneHighlight}>+{normalizeMalawiPhone(rawPhone)}</Text>
              </Text>

              {infoMsg && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryLight} />
                  <Text style={styles.infoText}>{infoMsg}</Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                <TextInput
                  ref={otpInputRef}
                  style={styles.hiddenOtpInput}
                  value={otpCode}
                  onChangeText={(val) => setOtpCode(val.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <View style={styles.otpBoxesRow}>
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const digit = otpCode[idx] || '';
                    const isFocused = otpCode.length === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          isFocused ? styles.otpBoxFocused : null,
                        ]}
                        activeOpacity={1}
                        onPress={() => otpInputRef.current?.focus()}
                      >
                        <Text style={styles.otpDigitText}>{digit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.cashOut} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0B0F19" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#0B0F19" />
                    <Text style={styles.primaryBtnText}>Verify & Launch Shop</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend SMS row */}
              <View style={styles.resendRow}>
                {resendCooldown > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in <Text style={{ color: COLORS.textPrimary }}>{resendCooldown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={styles.resendActionText}>Resend SMS Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Privacy footer */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.footerText}>
              Your financial ledger stays isolated and encrypted to your shop account.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardBrandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  cardBrandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  phoneHighlight: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  operatorBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  operatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  countryCodeBadge: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    marginRight: 10,
  },
  countryCodeText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cashOutBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.cashOut,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cashInBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B0F19',
  },
  otpContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0.01,
    width: '100%',
    height: '100%',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
  },
  otpBoxFocused: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryGlow,
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resendActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
