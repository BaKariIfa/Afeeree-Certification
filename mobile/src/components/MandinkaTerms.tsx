import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Volume2, VolumeX, BookOpen, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { colors } from '@/lib/theme';
import { mandinkaTerms } from '@/lib/mockData';

interface MandinkaTermsProps {
  visible: boolean;
  onClose: () => void;
}

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function MandinkaTerms({ visible, onClose }: MandinkaTermsProps) {
  const [playingTerm, setPlayingTerm] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!visible || !fontsLoaded) return null;

  const handlePlayAudio = async (term: string, phonetic: string) => {
    triggerHaptic();

    if (playingTerm === term) {
      await Speech.stop();
      setPlayingTerm(null);
      return;
    }

    await Speech.stop();
    setPlayingTerm(term);

    Speech.speak(phonetic, {
      language: 'en',
      pitch: 1.0,
      rate: 0.75,
      onDone: () => setPlayingTerm(null),
      onError: () => setPlayingTerm(null),
      onStopped: () => setPlayingTerm(null),
    });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <Pressable className="flex-1" onPress={onClose} />

      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(300)}
        className="rounded-t-3xl"
        style={{ backgroundColor: colors.cream[100], maxHeight: '80%' }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}>
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.gold[100] }}
            >
              <BookOpen size={20} color={colors.gold[600]} />
            </View>
            <View>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-xl"
              >
                Mandinka Terms
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                Key vocabulary for AFeeree
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic();
              onClose();
            }}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.neutral[100] }}
          >
            <X size={18} color={colors.neutral[600]} />
          </Pressable>
        </View>

        {/* Terms List */}
        <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
          {mandinkaTerms.map((item, index) => (
            <View
              key={item.term}
              className="flex-row items-center p-4 mb-3 rounded-xl"
              style={{
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: colors.neutral[200],
              }}
            >
              <View className="flex-1">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600] }}
                  className="text-lg"
                >
                  {item.term}
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                  className="text-base mt-1"
                >
                  {item.meaning}
                </Text>
              </View>

              <Pressable
                onPress={() => handlePlayAudio(item.term, item.phonetic)}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: playingTerm === item.term ? colors.primary[500] : colors.primary[100],
                }}
              >
                {playingTerm === item.term ? (
                  <Volume2 size={22} color="white" />
                ) : (
                  <Volume2 size={22} color={colors.primary[500]} />
                )}
              </Pressable>
            </View>
          ))}

          <View className="h-6" />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}
