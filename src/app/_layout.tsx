import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import SplashScreen from '../components/SplashScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import { DatabaseProvider } from '../context/DatabaseContext';
import { useAutoUpdates } from '../hooks/useAutoUpdates';

const HAS_ONBOARDED_KEY = '@glegder_has_onboarded_v1';

export default function RootLayout() {
  useAutoUpdates();
  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(HAS_ONBOARDED_KEY);
      setHasOnboarded(value === 'true');
    } catch {
      setHasOnboarded(false);
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
      setHasOnboarded(true);
    } catch {
      setHasOnboarded(true);
    }
  };

  // 1. Splash Screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  // 2. Loading state check
  if (hasOnboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 3. Onboarding Screen
  if (!hasOnboarded) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={handleFinishOnboarding} />
      </>
    );
  }

  // 4. Main App Tabs Stack
  return (
    <DatabaseProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
