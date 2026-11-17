import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge: string;
  title: string;
  subtitle: string;
  tipText: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'wallet-outline',
    iconColor: COLORS.cashIn,
    badge: 'DAILY CASHFLOW',
    title: 'Record Cash In & Cash Out in 2 Taps',
    subtitle:
      'No complicated accounting terms. Enter today’s sales and expenses with minimal effort as you run your shop.',
    tipText: 'Green for Cash In, Red for Cash Out — dead simple.',
  },
  {
    id: '2',
    icon: 'alarm-outline',
    iconColor: COLORS.warning,
    badge: 'IN-APP DEBT ALERTS',
    title: 'Never Forget Who Owes You Money',
    subtitle:
      'Record customer loans with their phone number and due date. Glegder sends you timely in-app debt notifications right when payment is due.',
    tipText: 'Get alerted directly inside the app — no extra apps needed.',
  },
  {
    id: '3',
    icon: 'cloud-offline-outline',
    iconColor: COLORS.primaryLight,
    badge: 'ALIBE BUNDLE READY',
    title: 'Works 100% Offline, Syncs Automatically',
    subtitle:
      'Record transactions even when you have zero data bundle. As soon as you connect to Wi-Fi or data, your ledger syncs seamlessly.',
    tipText: 'Always reliable, wherever your grocery or shop is located.',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Glegder</Text>
        </View>
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconCircleWrapper}>
              <View style={[styles.iconCircle, { borderColor: item.iconColor }]}>
                <Ionicons name={item.icon} size={64} color={item.iconColor} />
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

            <View style={styles.tipCard}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>{item.tipText}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Start Using Glegder' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'arrow-forward-outline' : 'chevron-forward-outline'}
            size={18}
            color={COLORS.textInverse}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    marginRight: 8,
  },
  brandName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width: width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWrapper: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    marginTop: -16,
    backgroundColor: COLORS.bgCardHover,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  slideTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
  },
  slideSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: width - 64,
  },
  tipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: COLORS.borderLight,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
