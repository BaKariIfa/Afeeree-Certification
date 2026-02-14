import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, RotateCcw, X, Timer } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { useUserStore } from '@/lib/userStore';

interface PracticeTimerProps {
  visible: boolean;
  onClose: () => void;
}

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function PracticeTimer({ visible, onClose }: PracticeTimerProps) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addPracticeTime = useUserStore(s => s.addPracticeTime);

  const pulseValue = useSharedValue(1);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (isRunning) {
      pulseValue.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [isRunning, pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    triggerHaptic();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerHaptic();
    setIsRunning(false);
    setSeconds(0);
  };

  const handleClose = () => {
    triggerHaptic();
    if (seconds > 0) {
      addPracticeTime(seconds);
    }
    setIsRunning(false);
    setSeconds(0);
    onClose();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="w-[90%] max-w-[340px] rounded-3xl overflow-hidden"
          style={{ backgroundColor: colors.cream[100] }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-5 py-4"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <View className="flex-row items-center">
              <Timer size={24} color={colors.gold[300]} />
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white' }}
                className="text-xl ml-3"
              >
                Practice Timer
              </Text>
            </View>
            <Pressable onPress={handleClose} className="p-1">
              <X size={24} color="white" />
            </Pressable>
          </View>

          {/* Timer Display */}
          <View className="items-center py-10">
            <Animated.View
              style={[
                pulseStyle,
                {
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: isRunning ? colors.primary[100] : colors.neutral[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: isRunning ? colors.primary[500] : colors.neutral[300],
                },
              ]}
            >
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-5xl"
              >
                {formatTime(seconds)}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm mt-1"
              >
                {isRunning ? 'Practicing...' : 'Ready'}
              </Text>
            </Animated.View>
          </View>

          {/* Controls */}
          <View className="flex-row justify-center items-center pb-8 px-6">
            <Pressable
              onPress={handleReset}
              className="w-14 h-14 rounded-full items-center justify-center mr-6"
              style={{ backgroundColor: colors.neutral[200] }}
            >
              <RotateCcw size={24} color={colors.neutral[600]} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: isRunning ? colors.gold[500] : colors.primary[500] }}
            >
              {isRunning ? (
                <Pause size={36} color="white" />
              ) : (
                <Play size={36} color="white" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            <View className="w-14 h-14 ml-6" />
          </View>

          {/* Tip */}
          <View className="px-6 pb-6">
            <View
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.gold[50] }}
            >
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                className="text-sm text-center"
              >
                Practice time is saved when you close the timer
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
