import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Key, ShieldCheck, AlertCircle, CreditCard, Eye, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { useUserStore } from '@/lib/userStore';
import { useAccessCodeStore } from '@/lib/accessCodeStore';
import { logSquareConfig } from '@/lib/squareConfig';

export default function AccessCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const setAccess = useUserStore(s => s.setAccess);
  const setDemoMode = useUserStore(s => s.setDemoMode);
  const setOnboarded = useUserStore(s => s.setOnboarded);
  const setUser = useUserStore(s => s.setUser);
  const isCodeValid = useAccessCodeStore(s => s.isCodeValid);
  const markCodeUsed = useAccessCodeStore(s => s.markCodeUsed);
  const loadCodes = useAccessCodeStore(s => s.loadCodes);

  // Load codes and check Square config on mount
  useEffect(() => {
    loadCodes();
    logSquareConfig();
  }, []);

  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter an access code');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate a brief verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = await isCodeValid(code);
    if (result.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const normCode = code.toUpperCase().trim();
      setAccess(true, normCode);

      if (result.userName && result.userEmail) {
        // Returning user — restore their profile and skip onboarding
        setUser(result.userName, result.userEmail);
        setOnboarded(true);
        await markCodeUsed(normCode, result.userEmail, result.userName);
        router.replace('/(tabs)');
      } else {
        // First time — collect name/email via onboarding
        await markCodeUsed(normCode, '');
        router.replace('/onboarding');
      }
    } else {
      setIsVerifying(false);
      setError('Invalid access code. Please check your code and try again.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handlePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDemoMode(true);
    setAccess(true, 'DEMO');
    setUser('Preview User', '');
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[500], colors.cream[100]]}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View style={{ paddingTop: insets.top + 16, flex: 1, paddingHorizontal: 24 }}>
            {/* Back Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 8 }}
            >
              <ArrowLeft size={24} color="white" />
              <Text style={{ fontFamily: 'DMSans_500Medium', color: 'white', fontSize: 16, marginLeft: 8 }}>
                Back
              </Text>
            </Pressable>
            {/* Logo */}
            <Animated.View
              entering={FadeInDown.duration(800)}
              className="items-center"
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Image
                  source={require('../../public/image-1769399524.png')}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  contentFit="cover"
                />
              </View>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.gold[300] }}
                className="text-2xl mt-4 text-center"
              >
                AFeeree Certification
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)' }}
                className="text-base mt-2 text-center"
              >
                The Physical Language
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(300)}
              className="flex-1 justify-center"
            >
              <Animated.View
                style={[shakeStyle, {
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 24,
                  elevation: 8,
                }]}
                className="p-6 rounded-3xl"
              >
                <View className="items-center mb-4">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.gold[100] }}
                  >
                    <ShieldCheck size={32} color={colors.gold[600]} />
                  </View>
                </View>

                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                  className="text-2xl text-center"
                >
                  Enter Access Code
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                  className="text-base text-center mt-2 mb-6"
                >
                  Enter the code provided by your program administrator
                </Text>

                <View
                  className="flex-row items-center px-4 py-4 rounded-xl"
                  style={{ backgroundColor: colors.neutral[100] }}
                >
                  <Key size={22} color={colors.neutral[400]} />
                  <TextInput
                    ref={inputRef}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text.toUpperCase());
                      setError('');
                    }}
                    placeholder="ACCESS CODE"
                    placeholderTextColor={colors.neutral[400]}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: colors.neutral[800],
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 18,
                      letterSpacing: 2,
                    }}
                  />
                </View>

                {error ? (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    className="flex-row items-center mt-3 px-2"
                  >
                    <AlertCircle size={16} color={colors.error} />
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular', color: colors.error }}
                      className="text-sm ml-2"
                    >
                      {error}
                    </Text>
                  </Animated.View>
                ) : null}

                <Pressable
                  onPress={handleVerify}
                  disabled={isVerifying}
                  className="mt-6 py-4 rounded-xl flex-row items-center justify-center"
                  style={{
                    backgroundColor: isVerifying ? colors.primary[300] : colors.primary[500],
                  }}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                      className="text-base"
                    >
                      Verify Access
                    </Text>
                  )}
                </Pressable>

                <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.gold[50] }}>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], lineHeight: 20 }}
                    className="text-sm text-center"
                  >
                    Don't have an access code?
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/purchase');
                    }}
                    className="mt-3 py-3 rounded-xl flex-row items-center justify-center"
                    style={{ backgroundColor: colors.gold[500] }}
                  >
                    <CreditCard size={18} color="white" />
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                      className="text-sm ml-2"
                    >
                      Enrol now for the introductory course towards certification
                    </Text>
                  </Pressable>
                </View>

                <View className="mt-4">
                  <Pressable
                    onPress={handlePreview}
                    className="py-4 rounded-xl flex-row items-center justify-center"
                    style={{ backgroundColor: colors.primary[600] }}
                  >
                    <Eye size={20} color="white" />
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}
                      className="ml-2"
                    >
                      Preview App
                    </Text>
                  </Pressable>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }}
                    className="text-xs text-center mt-2"
                  >
                    Explore a limited preview without enrolling
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(500)}
              style={{ paddingBottom: insets.bottom + 24 }}
            >
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-xs text-center"
              >
                This app is exclusively for{'\n'}AFeeree Certification participants
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
