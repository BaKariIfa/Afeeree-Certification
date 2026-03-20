import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Volume2, BookOpen, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

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
  const soundRef = useRef<Audio.Sound | null>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) return null;

  const stopCurrent = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingTerm(null);
  };

  const handlePlayAudio = async (term: string, audio: number) => {
    triggerHaptic();

    if (playingTerm === term) {
      await stopCurrent();
      return;
    }

    await stopCurrent();
    setPlayingTerm(term);

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(audio);
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingTerm(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.error('[Audio]', e);
      setPlayingTerm(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={{ backgroundColor: colors.cream[100], maxHeight: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
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
                stopCurrent();
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
            {mandinkaTerms.map((item) => (
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
                  onPress={() => handlePlayAudio(item.term, item.audio)}
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: playingTerm === item.term ? colors.primary[500] : colors.primary[100],
                  }}
                >
                  <Volume2 size={22} color={playingTerm === item.term ? 'white' : colors.primary[500]} />
                </Pressable>
              </View>
            ))}

            <View className="h-6" />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
