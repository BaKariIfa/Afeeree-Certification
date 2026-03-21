import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/lib/userStore';
import { colors } from '@/lib/theme';

export default function StartScreen() {
  const router = useRouter();
  const loadUserData = useUserStore(s => s.loadUserData);
  const hasAccess = useUserStore(s => s.hasAccess);
  const isOnboarded = useUserStore(s => s.isOnboarded);

  const didNavigateRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await loadUserData();
      } finally {
        // Even if loading fails, don't keep the user behind splash.
        SplashScreen.hideAsync().catch(() => {});
      }

      if (cancelled || didNavigateRef.current) return;
      didNavigateRef.current = true;

      if (!hasAccess) {
        router.replace('/landing');
        return;
      }

      if (!isOnboarded) {
        router.replace('/onboarding');
        return;
      }

      // Check if agreement has been signed
      const agreementSigned = await AsyncStorage.getItem('agreementSigned');
      if (!agreementSigned) {
        router.replace('/agreement');
        return;
      }

      router.replace('/(tabs)/');
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [hasAccess, isOnboarded, loadUserData, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cream[100],
      }}
    >
      <ActivityIndicator />
    </View>
  );
}

