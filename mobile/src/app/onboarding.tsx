import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, User, Mail } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/lib/theme';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = async () => {
    triggerHaptic();

    if (step === 1) {
      setStep(2);
    } else {
      // Save user data
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('onboardingComplete', 'true');
      await AsyncStorage.setItem('enrollmentDate', new Date().toISOString());

      // Navigate to home
      router.replace('/(tabs)/');
    }
  };

  const isValid = step === 1 ? name.trim().length > 0 : email.trim().length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[500], colors.cream[100]]}
        locations={[0, 0.4, 1]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View style={{ paddingTop: insets.top + 40, flex: 1, paddingHorizontal: 24 }}>
            {/* Logo */}
            <Animated.View
              entering={FadeInDown.duration(800)}
              className="items-center"
            >
              <Image
                source={require('../../public/image-1769399524.png')}
                style={{ width: 120, height: 120, borderRadius: 60 }}
                contentFit="cover"
              />
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
              <View
                className="p-6 rounded-3xl"
                style={{
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                  className="text-2xl text-center"
                >
                  {step === 1 ? 'Welcome' : 'Almost Done'}
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                  className="text-base text-center mt-2 mb-6"
                >
                  {step === 1
                    ? 'Enter your name to get started'
                    : 'Enter your email to complete setup'}
                </Text>

                {step === 1 ? (
                  <View
                    className="flex-row items-center px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.neutral[100] }}
                  >
                    <User size={20} color={colors.neutral[400]} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor={colors.neutral[400]}
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        color: colors.neutral[800],
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                      }}
                      autoFocus
                    />
                  </View>
                ) : (
                  <View
                    className="flex-row items-center px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.neutral[100] }}
                  >
                    <Mail size={20} color={colors.neutral[400]} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Your email"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        color: colors.neutral[800],
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                      }}
                      autoFocus
                    />
                  </View>
                )}

                <Pressable
                  onPress={handleContinue}
                  disabled={!isValid}
                  className="mt-6 py-4 rounded-xl flex-row items-center justify-center"
                  style={{
                    backgroundColor: isValid ? colors.primary[500] : colors.neutral[200],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: isValid ? 'white' : colors.neutral[400],
                    }}
                    className="text-base mr-2"
                  >
                    {step === 1 ? 'Continue' : 'Get Started'}
                  </Text>
                  <ArrowRight size={20} color={isValid ? 'white' : colors.neutral[400]} />
                </Pressable>

                {/* Step indicator */}
                <View className="flex-row justify-center mt-6">
                  <View
                    className="w-2 h-2 rounded-full mx-1"
                    style={{ backgroundColor: colors.primary[500] }}
                  />
                  <View
                    className="w-2 h-2 rounded-full mx-1"
                    style={{ backgroundColor: step === 2 ? colors.primary[500] : colors.neutral[300] }}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(500)}
              style={{ paddingBottom: insets.bottom + 24 }}
            >
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm text-center"
              >
                By continuing, you agree to participate in the{'\n'}AFeeree Certification Program
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
