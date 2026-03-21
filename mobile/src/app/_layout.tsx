import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAccessCodeStore } from '@/lib/accessCodeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'start',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="start" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="access-code" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="module/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="purchase" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadAdminState = useAccessCodeStore(s => s.loadAdminState);
  const setAdmin = useAccessCodeStore(s => s.setAdmin);

  useEffect(() => {
    const init = async () => {
      // If a participant access code is saved, ensure admin mode is off
      const accessCode = await AsyncStorage.getItem('accessCode');
      if (accessCode) {
        await setAdmin(false);
      } else {
        await loadAdminState();
      }
      SplashScreen.hideAsync().catch(() => {});
    };
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <RootLayoutNav colorScheme={colorScheme} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}