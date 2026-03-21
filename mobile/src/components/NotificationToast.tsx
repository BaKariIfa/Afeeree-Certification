import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { colors } from '@/lib/theme';

export interface ToastData {
  id: string;
  title: string;
  body: string;
}

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

async function playNotificationSound() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/audio/notification.wav'),
      { volume: 0.8 }
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (_) {}
}

export function NotificationToast({ toast, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    translateY.value = withTiming(-140, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  };

  useEffect(() => {
    if (!toast) return;

    playNotificationSound();

    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 200 });

    timerRef.current = setTimeout(() => {
      dismiss();
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top + 10,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={dismiss}>
        <View
          style={{
            backgroundColor: colors.primary[500],
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <MessageCircle size={20} color={colors.gold[400]} />
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'DMSans_600SemiBold',
                color: 'white',
                fontSize: 14,
                marginBottom: 3,
              }}
            >
              {toast.title}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: 'DMSans_400Regular',
                color: 'rgba(255,255,255,0.82)',
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {toast.body}
            </Text>
          </View>

          {/* Live indicator dot */}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.gold[400],
              marginLeft: 10,
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
