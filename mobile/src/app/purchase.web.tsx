import React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, ArrowRight, ShieldCheck, Check, BookOpen, Award, Users, Key } from 'lucide-react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';

import { colors } from '@/lib/theme';

// Square Payment Link
const SQUARE_PAYMENT_LINK = 'https://square.link/u/v0CpuVqO';

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Program price
  const PROGRAM_PRICE = 600;
  const PROGRAM_NAME = 'AFeeree Introduction to Certification';

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const handlePayment = () => {
    // Open Square payment link
    Linking.openURL(SQUARE_PAYMENT_LINK);
  };

  if (!fontsLoaded) {
    return null;
  }

  const features = [
    { icon: BookOpen, text: 'Experience the physical language' },
    { icon: Users, text: 'Understand the research foundation' },
    { icon: Award, text: 'Prepare for advanced study & certification' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ minHeight: '100%' }}
      >
        <LinearGradient
          colors={[colors.primary[600], colors.primary[500], colors.cream[100]]}
          locations={[0, 0.4, 1]}
          style={{ flex: 1, paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={require('../../public/image-1769399524.png')}
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16 }}
              contentFit="cover"
            />
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                color: colors.gold[300],
                fontSize: 28,
                textAlign: 'center',
              }}
            >
              {PROGRAM_NAME}
            </Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 16,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              The Physical Language
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
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                color: colors.neutral[800],
                fontSize: 22,
                textAlign: 'center',
              }}
            >
              Enroll Today
            </Text>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                color: colors.neutral[500],
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
                marginBottom: 24,
              }}
            >
              Experience the physicality and understand the research
            </Text>

            {/* Features */}
            <View style={{ marginBottom: 24 }}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < features.length - 1 ? 1 : 0,
                    borderBottomColor: colors.neutral[100],
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.gold[100],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <feature.icon size={20} color={colors.gold[600]} />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: colors.neutral[700],
                      fontSize: 15,
                      marginLeft: 12,
                      flex: 1,
                    }}
                  >
                    {feature.text}
                  </Text>
                  <Check size={20} color={colors.success} />
                </View>
              ))}
            </View>

            {/* Price */}
            <View
              style={{
                backgroundColor: colors.gold[50],
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[500],
                  fontSize: 14,
                }}
              >
                Program Investment
              </Text>
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  color: colors.primary[600],
                  fontSize: 48,
                  marginTop: 4,
                }}
              >
                ${PROGRAM_PRICE}
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[500],
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                One-time payment • Course access
              </Text>
            </View>

            {/* Pay Button */}
            <Pressable
              onPress={handlePayment}
              style={{
                backgroundColor: colors.primary[500],
                borderRadius: 12,
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CreditCard size={22} color="white" style={{ marginRight: 10 }} />
              <Text
                style={{
                  fontFamily: 'DMSans_600SemiBold',
                  color: 'white',
                  fontSize: 18,
                }}
              >
                Pay ${PROGRAM_PRICE} with Square
              </Text>
            </Pressable>

            {/* Already have access code */}
            <Pressable
              onPress={() => router.push('/access-code')}
              style={{
                borderWidth: 1,
                borderColor: colors.neutral[300],
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Key size={18} color={colors.neutral[600]} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  color: colors.neutral[600],
                  fontSize: 15,
                }}
              >
                I already have an access code
              </Text>
            </Pressable>

            {/* Security Note */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
              <ShieldCheck size={16} color={colors.neutral[400]} />
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[400],
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                Secure payment powered by Square
              </Text>
            </View>
          </View>

          {/* Footer Info */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                color: colors.neutral[500],
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              After payment, you'll receive an access code via email{'\n'}
              to begin your introduction to the physical language.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
