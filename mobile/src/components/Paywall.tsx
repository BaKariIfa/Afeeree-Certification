import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Check, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import { type PurchasesPackage } from 'react-native-purchases';

import { colors } from '@/lib/theme';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

const features = [
  'Access to Account Settings',
  'Priority Support',
  'Advanced Progress Tracking',
  'Exclusive Content',
];

export const Paywall: React.FC<PaywallProps> = ({
  visible,
  onClose,
  onPurchaseSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);

    if (!isRevenueCatEnabled()) {
      setError('Subscriptions are not available on this platform.');
      setLoading(false);
      return;
    }

    const result = await getOfferings();
    if (result.ok && result.data.current) {
      const lifetime = result.data.current.availablePackages.find(
        (pkg) => pkg.identifier === '$rc_lifetime'
      );
      setLifetimePackage(lifetime || null);
    } else {
      setError('Unable to load subscription options.');
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!lifetimePackage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    setError(null);

    const result = await purchasePackage(lifetimePackage);
    setPurchasing(false);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPurchaseSuccess?.();
      onClose();
    } else if (result.reason === 'sdk_error') {
      // User cancelled or other error
      setError('Purchase was cancelled or failed. Please try again.');
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);
    setError(null);

    const result = await restorePurchases();
    setRestoring(false);

    if (result.ok) {
      const hasActive = Object.keys(result.data.entitlements.active || {}).length > 0;
      if (hasActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPurchaseSuccess?.();
        onClose();
      } else {
        setError('No previous purchases found.');
      }
    } else {
      setError('Unable to restore purchases. Please try again.');
    }
  };

  if (!fontsLoaded) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
        {/* Header */}
        <View className="flex-row justify-end p-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            className="p-2"
          >
            <X size={24} color={colors.neutral[600]} />
          </Pressable>
        </View>

        {/* Content */}
        <View className="flex-1 px-6">
          {/* Premium Badge */}
          <Animated.View entering={FadeInUp.duration(500)} className="items-center">
            <LinearGradient
              colors={[colors.gold[400], colors.gold[600]]}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={40} color="white" />
            </LinearGradient>

            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-3xl mt-6 text-center"
            >
              Upgrade to Premium
            </Text>

            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-base mt-2 text-center"
            >
              Unlock all features and get the most out of your certification journey
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} className="mt-8">
            {features.map((feature, index) => (
              <View key={feature} className="flex-row items-center mb-4">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.gold[100] }}
                >
                  <Check size={18} color={colors.gold[600]} />
                </View>
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700] }}
                  className="text-base ml-3"
                >
                  {feature}
                </Text>
              </View>
            ))}
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} className="mt-4">
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.error }}
                className="text-sm text-center"
              >
                {error}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Purchase Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} className="px-6 pb-10">
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary[500]} />
          ) : lifetimePackage ? (
            <>
              {/* Price Card */}
              <View
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: colors.gold[400] }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Sparkles size={20} color={colors.gold[500]} />
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                      className="text-lg ml-2"
                    >
                      Lifetime Access
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary[500] }}
                    className="text-2xl"
                  >
                    {lifetimePackage.product.priceString}
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                  className="text-sm mt-1"
                >
                  one-time purchase, access forever
                </Text>
              </View>

              {/* Subscribe Button */}
              <Pressable
                onPress={handlePurchase}
                disabled={purchasing}
                className="py-4 rounded-xl items-center"
                style={{
                  backgroundColor: purchasing ? colors.neutral[300] : colors.primary[500],
                }}
              >
                {purchasing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                    className="text-lg"
                  >
                    Purchase Now
                  </Text>
                )}
              </Pressable>

              {/* Restore */}
              <Pressable
                onPress={handleRestore}
                disabled={restoring}
                className="py-3 items-center mt-3"
              >
                {restoring ? (
                  <ActivityIndicator color={colors.neutral[500]} size="small" />
                ) : (
                  <Text
                    style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }}
                    className="text-sm"
                  >
                    Restore Purchases
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-center"
            >
              Subscription options unavailable
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Paywall;
