import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, CreditCard, Mail, User, Copy, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { colors } from '@/lib/theme';
import { logSquareConfig } from '@/lib/squareConfig';
import { useAccessCodeStore } from '@/lib/accessCodeStore';

type PaymentStep = 'details' | 'processing' | 'success';

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<PaymentStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Access code store to save generated codes
  const generateCode = useAccessCodeStore(s => s.generateCode);

  // Program price
  const PROGRAM_PRICE = 600;
  const PROGRAM_NAME = 'AFeeree Certification Program';

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePurchase = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError('Please enter your full name');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Open Square Checkout Link
    const SQUARE_CHECKOUT_URL = 'https://square.link/u/v0CpuVqO';

    // On web, open in same window. On mobile, open in browser
    if (typeof window !== 'undefined') {
      window.open(SQUARE_CHECKOUT_URL, '_blank');
    } else {
      // For React Native, use Linking
      const { Linking } = require('react-native');
      Linking.openURL(SQUARE_CHECKOUT_URL);
    }
  };

  const copyCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[500], colors.cream[100]]}
        locations={[0, 0.35, 1]}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          {step !== 'success' && (
            <Pressable
              onPress={handleGoBack}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                marginBottom: 20,
              }}
            >
              <ArrowLeft size={24} color="white" />
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  color: 'white',
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Back
              </Text>
            </Pressable>
          )}

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step === 'success' ? (
                <CheckCircle size={36} color={colors.gold[300]} />
              ) : (
                <CreditCard size={36} color={colors.gold[300]} />
              )}
            </View>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                color: colors.gold[300],
                fontSize: 22,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {step === 'success' ? 'Payment Successful!' : 'Enroll Now'}
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            }}
          >
            {step === 'details' && (
              <>
                <Text
                  style={{
                    fontFamily: 'PlayfairDisplay_700Bold',
                    color: colors.neutral[800],
                    fontSize: 20,
                    textAlign: 'center',
                  }}
                >
                  {PROGRAM_NAME}
                </Text>
                <Text
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    color: colors.neutral[500],
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Includes in-class sessions & app access
                </Text>

                {/* Price */}
                <View
                  style={{
                    backgroundColor: colors.gold[50],
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: colors.primary[600],
                      fontSize: 32,
                    }}
                  >
                    ${PROGRAM_PRICE}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'DMSans_400Regular',
                      color: colors.neutral[500],
                      fontSize: 12,
                    }}
                  >
                    One-time payment
                  </Text>
                </View>

                {/* Name Input */}
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: colors.neutral[700],
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    Full Name
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.neutral[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <User size={20} color={colors.neutral[400]} />
                    <TextInput
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        setError('');
                      }}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.neutral[400]}
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontFamily: 'DMSans_400Regular',
                        fontSize: 16,
                        color: colors.neutral[800],
                      }}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={{ marginTop: 16 }}>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: colors.neutral[700],
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    Email Address
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.neutral[100],
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <Mail size={20} color={colors.neutral[400]} />
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontFamily: 'DMSans_400Regular',
                        fontSize: 16,
                        color: colors.neutral[800],
                      }}
                    />
                  </View>
                </View>

                {error ? (
                  <Text
                    style={{
                      fontFamily: 'DMSans_400Regular',
                      color: colors.error,
                      fontSize: 14,
                      textAlign: 'center',
                      marginTop: 16,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* Purchase Button */}
                <Pressable
                  onPress={handlePurchase}
                  style={{
                    backgroundColor: colors.primary[500],
                    borderRadius: 12,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 24,
                  }}
                >
                  <CreditCard size={20} color="white" style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: 'white',
                      fontSize: 16,
                    }}
                  >
                    Pay ${PROGRAM_PRICE}
                  </Text>
                </Pressable>

                {/* Security Note */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 16,
                  }}
                >
                  <ShieldCheck size={16} color={colors.neutral[400]} />
                  <Text
                    style={{
                      fontFamily: 'DMSans_400Regular',
                      color: colors.neutral[400],
                      fontSize: 12,
                      marginLeft: 6,
                    }}
                  >
                    Secure payment via Square
                  </Text>
                </View>
              </>
            )}

            {step === 'processing' && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text
                  style={{
                    fontFamily: 'DMSans_600SemiBold',
                    color: colors.neutral[800],
                    fontSize: 18,
                    marginTop: 20,
                  }}
                >
                  Processing Payment...
                </Text>
                <Text
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    color: colors.neutral[500],
                    fontSize: 14,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Please wait while we securely process your payment.
                </Text>
              </View>
            )}

            {step === 'success' && (
              <>
                <Text
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    color: colors.neutral[500],
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  Welcome to the program, {name}!
                </Text>

                {/* Access Code Display */}
                <View
                  style={{
                    backgroundColor: colors.gold[50],
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: colors.neutral[600],
                      fontSize: 14,
                      textAlign: 'center',
                      marginBottom: 12,
                    }}
                  >
                    Your Access Code
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: colors.gold[400],
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'DMSans_600SemiBold',
                        color: colors.primary[600],
                        fontSize: 28,
                        textAlign: 'center',
                        letterSpacing: 4,
                      }}
                    >
                      {accessCode}
                    </Text>
                  </View>
                  <Pressable
                    onPress={copyCode}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Copy size={16} color={colors.primary[500]} />
                    <Text
                      style={{
                        fontFamily: 'DMSans_500Medium',
                        color: colors.primary[500],
                        fontSize: 14,
                        marginLeft: 6,
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy Code'}
                    </Text>
                  </Pressable>
                </View>

                {/* Instructions */}
                <View
                  style={{
                    backgroundColor: colors.neutral[100],
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: colors.neutral[800],
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    What's Next?
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'DMSans_400Regular',
                      color: colors.neutral[600],
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    1. Save your access code above{'\n'}
                    2. Tap the button below to enter it{'\n'}
                    3. Complete your profile setup{'\n'}
                    4. Start your certification journey!
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.replace('/access-code');
                  }}
                  style={{
                    backgroundColor: colors.primary[500],
                    borderRadius: 12,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_600SemiBold',
                      color: 'white',
                      fontSize: 16,
                    }}
                  >
                    Enter Access Code
                  </Text>
                  <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} />
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
