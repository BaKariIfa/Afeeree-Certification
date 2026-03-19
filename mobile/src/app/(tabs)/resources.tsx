import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Globe,
  Play,
  ChevronRight,
  Volume2
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Speech from 'expo-speech';

import { colors } from '@/lib/theme';
import { resourceLinks, videoLinks, mandinkaTerms, foundationalPrinciples } from '@/lib/mockData';
import { useNotationStore } from '@/lib/notationStore';
import VideoModal from '@/components/VideoModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [videoModal, setVideoModal] = useState<{ vimeoId: string; title: string; subtitle: string } | null>(null);
  const [speakingTerm, setSpeakingTerm] = useState<string | null>(null);

  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  React.useEffect(() => { loadNotationPdfUrl(); }, []);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const onRefresh = () => {
    triggerHaptic();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const openPdf = (fallbackUrl: string) => {
    triggerHaptic();
    const pdfUrl = notationPdfUrl ?? fallbackUrl;
    const viewerUrl = `${BACKEND_URL}/api/notation/view?url=${encodeURIComponent(pdfUrl)}`;
    WebBrowser.openBrowserAsync(viewerUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const openRawPdf = (url: string) => {
    triggerHaptic();
    const viewerUrl = `${BACKEND_URL}/api/notation/view?url=${encodeURIComponent(url)}`;
    WebBrowser.openBrowserAsync(viewerUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const openVideo = (vimeoId: string, title: string, subtitle: string) => {
    triggerHaptic();
    setVideoModal({ vimeoId, title, subtitle });
  };

  const handleSpeakTerm = async (term: string, phonetic: string) => {
    triggerHaptic();
    if (speakingTerm === term) {
      await Speech.stop();
      setSpeakingTerm(null);
      return;
    }
    await Speech.stop();
    setSpeakingTerm(term);
    Speech.speak(phonetic, {
      language: 'en',
      pitch: 1.0,
      rate: 0.75,
      onDone: () => setSpeakingTerm(null),
      onError: () => setSpeakingTerm(null),
      onStopped: () => setSpeakingTerm(null),
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <VideoModal
        visible={videoModal !== null}
        onClose={() => setVideoModal(null)}
        vimeoId={videoModal?.vimeoId ?? ''}
        title={videoModal?.title ?? ''}
        subtitle={videoModal?.subtitle}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center">
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/(tabs)/');
              }}
              className="mr-4 p-2 -ml-2"
            >
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View className="flex-1">
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-3xl"
              >
                Resources
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-base mt-1"
              >
                Learning materials & references
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Cultural Research Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} className="px-6 mb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            Cultural Research
          </Text>
          <Pressable
            onPress={() => openRawPdf(resourceLinks.culturalResearch)}
            className="p-4 rounded-2xl flex-row items-center"
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary[100] }}
            >
              <Globe size={24} color={colors.primary[500]} />
            </View>
            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-base"
              >
                Cultural Research Document
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                Historical and cultural context of AFeeree
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>

        {/* Video of Principles Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)} className="px-6 mb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            Video: Key Principles
          </Text>
          <Pressable
            onPress={() => openVideo(videoLinks.keyPrinciples, 'Seven Foundational Principles', 'Key movement principles')}
            className="p-4 rounded-2xl flex-row items-center"
            style={{
              backgroundColor: colors.primary[500],
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Video size={24} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                className="text-base"
              >
                Seven Foundational Principles
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)' }}
                className="text-sm"
              >
                Video explanation of core movement principles
              </Text>
            </View>
            <Play size={24} color="white" fill="white" />
          </Pressable>
        </Animated.View>

        {/* Seven Foundational Principles List */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} className="px-6 mb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            The Seven Principles
          </Text>
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            {foundationalPrinciples.map((principle, index) => (
              <View
                key={principle.name}
                className="p-4 flex-row items-center"
                style={{
                  borderBottomWidth: index < foundationalPrinciples.length - 1 ? 1 : 0,
                  borderBottomColor: colors.neutral[100],
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.gold[100] }}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[600] }}
                    className="text-sm"
                  >
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                    className="text-base"
                  >
                    {principle.name}
                  </Text>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                    className="text-sm mt-0.5"
                  >
                    {principle.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Mandinka Terminology Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(250)} className="px-6 mb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            Mandinka Terminology
          </Text>
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            {mandinkaTerms.map((item, index) => (
              <View
                key={item.term}
                className="p-4 flex-row items-center"
                style={{
                  borderBottomWidth: index < mandinkaTerms.length - 1 ? 1 : 0,
                  borderBottomColor: colors.neutral[100],
                }}
              >
                <Pressable
                  onPress={() => handleSpeakTerm(item.term, item.phonetic)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: speakingTerm === item.term ? colors.primary[500] : colors.primary[100] }}
                >
                  <Volume2 size={20} color={speakingTerm === item.term ? 'white' : colors.primary[500]} />
                </Pressable>
                <View className="flex-1 ml-3">
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600] }}
                    className="text-base"
                  >
                    {item.term}
                  </Text>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                    className="text-sm"
                  >
                    {item.meaning}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Additional Documents Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)} className="px-6 mb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            Additional Documents
          </Text>

          <Pressable
            onPress={() => openRawPdf(resourceLinks.notationImages)}
            className="p-4 rounded-2xl flex-row items-center mb-3"
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.gold[100] }}
            >
              <FileText size={24} color={colors.gold[600]} />
            </View>
            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-base"
              >
                Notation Images
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                Visual notation reference guide
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[400]} />
          </Pressable>

          <Pressable
            onPress={() => openPdf(resourceLinks.syllabus)}
            className="p-4 rounded-2xl flex-row items-center"
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary[100] }}
            >
              <BookOpen size={24} color={colors.primary[500]} />
            </View>
            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-base"
              >
                Full Syllabus PDF
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                {notationPdfUrl ? 'Uploaded version · watermarked' : 'Complete curriculum document'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
