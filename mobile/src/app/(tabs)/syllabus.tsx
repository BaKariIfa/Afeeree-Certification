import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Linking, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Clock, ChevronRight, Play, FileText, ArrowLeft, Video, Timer, BookOpenText, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

import { colors } from '@/lib/theme';
import { mockModules, resourceLinks, videoLinks } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import { useNotationStore } from '@/lib/notationStore';
import type { Module } from '@/lib/types';
import PracticeTimer from '@/components/PracticeTimer';
import MandinkaTerms from '@/components/MandinkaTerms';
import DemoBanner from '@/components/DemoBanner';
import VideoModal from '@/components/VideoModal';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const categories = ['All', 'Technique', 'Theory', 'Teaching Practice', 'Research'] as const;

export default function SyllabusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [videoModal, setVideoModal] = useState<{ vimeoId: string; title: string; subtitle: string } | null>(null);

  const completedLessons = useUserStore(s => s.completedLessons);
  const isDemoMode = useUserStore(s => s.isDemoMode);
  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  // Load uploaded notation URL on mount
  React.useEffect(() => { loadNotationPdfUrl(); }, []);

  const onRefresh = useCallback(() => {
    triggerHaptic();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const filteredModules = selectedCategory === 'All'
    ? mockModules
    : mockModules.filter(m => m.category === selectedCategory);

  const getProgressPercentage = (module: Module) => {
    const completed = completedLessons.filter(l => l.startsWith(`${module.id}-`)).length;
    if (module.lessons === 0) return 0;
    return Math.round((completed / module.lessons) * 100);
  };

  const openNotationPdf = (fallbackUrl: string) => {
    const pdfUrl = notationPdfUrl ?? fallbackUrl;
    const viewerUrl = `${BACKEND_URL}/api/notation/view?url=${encodeURIComponent(pdfUrl)}`;
    WebBrowser.openBrowserAsync(viewerUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const openSyllabusPDF = () => {
    if (isDemoMode) return;
    triggerHaptic();
    openNotationPdf(resourceLinks.syllabus);
  };

  const openVideo = (vimeoId: string, title: string, subtitle: string) => {
    if (isDemoMode) return;
    triggerHaptic();
    setVideoModal({ vimeoId, title, subtitle });
  };

  const handleModulePress = (module: Module) => {
    if (isDemoMode) return;
    triggerHaptic();
    openNotationPdf(module.pdfLink ?? resourceLinks.syllabus);
  };

  const handleCategoryPress = (category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <PracticeTimer visible={showTimer} onClose={() => setShowTimer(false)} />
      <MandinkaTerms visible={showTerms} onClose={() => setShowTerms(false)} />
      <DemoBanner />
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
          <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => navigateWithHaptic('/(tabs)/')}
                className="mr-4 p-2 -ml-2"
              >
                <ArrowLeft size={24} color={colors.neutral[800]} />
              </Pressable>
              <View>
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                  className="text-3xl"
                >
                  Syllabus
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                  className="text-base mt-1"
                >
                  AFeeree Certification Curriculum
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic();
                setShowTimer(true);
              }}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.gold[500] }}
            >
              <Timer size={24} color="white" />
            </Pressable>
          </Animated.View>
        </View>

        {/* View Full Syllabus Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(50)} className="px-6 mb-4">
          <Pressable
            onPress={openSyllabusPDF}
            className="flex-row items-center p-4 rounded-2xl"
            style={{ backgroundColor: isDemoMode ? colors.neutral[300] : colors.primary[500] }}
          >
            {isDemoMode ? <Lock size={24} color={colors.neutral[500]} /> : <FileText size={24} color="white" />}
            <View className="flex-1 ml-3">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: isDemoMode ? colors.neutral[500] : 'white' }}
                className="text-base"
              >
                {isDemoMode ? 'Full Program Only' : 'View Full Syllabus PDF'}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: isDemoMode ? colors.neutral[400] : colors.gold[300] }}
                className="text-sm"
              >
                {isDemoMode ? 'Enroll to access the complete curriculum' : 'Complete curriculum by BaKari Ifasegun Lindsay'}
              </Text>
            </View>
            {!isDemoMode && <ChevronRight size={20} color="white" />}
          </Pressable>
        </Animated.View>

        {/* Video Demonstrations Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(75)} className="px-6 mb-4">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
            className="text-lg mb-3"
          >
            Video Demonstrations
          </Text>
          {isDemoMode ? (
            <View
              className="flex-row items-center p-4 rounded-2xl"
              style={{ backgroundColor: colors.neutral[100], borderWidth: 1.5, borderColor: colors.neutral[200], borderStyle: 'dashed' }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.neutral[200] }}
              >
                <Lock size={18} color={colors.neutral[400]} />
              </View>
              <View className="flex-1 ml-3">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500] }} className="text-sm">
                  Videos locked in Preview Mode
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }} className="text-xs mt-0.5">
                  Enroll to watch Part 1 & Part 2 demonstrations
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => openVideo(videoLinks.part1, 'Part 1', 'Kata & Context')}
                className="flex-1 flex-row items-center p-4 rounded-2xl"
                style={{ backgroundColor: colors.gold[500] }}
              >
                <Video size={22} color="white" />
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-sm">Part 1</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[100] }} className="text-xs">Kata & Context</Text>
                </View>
                <Play size={18} color="white" fill="white" />
              </Pressable>
              <Pressable
                onPress={() => openVideo(videoLinks.part2, 'Part 2', 'Kata & Context')}
                className="flex-1 flex-row items-center p-4 rounded-2xl"
                style={{ backgroundColor: colors.gold[500] }}
              >
                <Video size={22} color="white" />
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-sm">Part 2</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[100] }} className="text-xs">Kata & Context</Text>
                </View>
                <Play size={18} color="white" fill="white" />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Mandinka Terms Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(85)} className="px-6 mb-4">
          <Pressable
            onPress={() => {
              triggerHaptic();
              setShowTerms(true);
            }}
            className="flex-row items-center p-4 rounded-2xl"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.gold[100] }}
            >
              <BookOpenText size={20} color={colors.gold[600]} />
            </View>
            <View className="flex-1 ml-3">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                className="text-base"
              >
                Mandinka Terms
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm"
              >
                Key vocabulary with pronunciation
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>

        {/* Category Filter */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6"
            contentContainerStyle={{ paddingRight: 24 }}
            style={{ flexGrow: 0 }}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => handleCategoryPress(category)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedCategory === category ? colors.primary[500] : 'white',
                  borderWidth: 1,
                  borderColor: selectedCategory === category ? colors.primary[500] : colors.neutral[200],
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    color: selectedCategory === category ? 'white' : colors.neutral[600]
                  }}
                  className="text-sm"
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Modules List */}
        <View className="px-6 mt-6">
          {filteredModules.map((module, index) => {
            const isLocked = isDemoMode && index >= 2;
            return (
            <Animated.View
              key={module.id}
              entering={FadeInUp.duration(500).delay(200 + index * 100)}
            >
              <Pressable
                className="mb-4 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                  opacity: isLocked ? 0.6 : 1,
                }}
                onPress={() => isLocked ? null : handleModulePress(module)}
              >
                {isLocked && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      zIndex: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.primary[600],
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Lock size={14} color="white" />
                      <Text
                        style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 12, marginLeft: 6 }}
                      >
                        Full Program Only
                      </Text>
                    </View>
                  </View>
                )}
                <View className="flex-row">
                  {/* Module Image */}
                  <View className="relative">
                    <Image
                      source={module.localImage || { uri: module.imageUrl }}
                      style={{ width: 110, height: 160 }}
                      contentFit="cover"
                    />
                    {module.completedLessons > 0 && module.completedLessons < module.lessons && (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                      >
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.primary[500] }}
                        >
                          <Play size={24} color="white" fill="white" />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Module Info */}
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <View className="flex-row items-center mb-1">
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: colors.primary[100] }}
                        >
                          <Text
                            style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                            className="text-xs"
                          >
                            {module.category}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                        className="text-sm"
                        numberOfLines={1}
                      >
                        {module.title}
                      </Text>
                      <Text
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                        className="text-xs mt-1"
                        numberOfLines={2}
                      >
                        {module.description}
                      </Text>
                      {module.notationRef && (
                        <Text
                          style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[600] }}
                          className="text-xs mt-1"
                        >
                          {module.notationRef}
                        </Text>
                      )}
                    </View>

                    <View>
                      {/* Duration and Lessons */}
                      <View className="flex-row items-center mt-2">
                        <Clock size={12} color={colors.neutral[400]} />
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                          className="text-xs ml-1"
                        >
                          {module.duration}
                        </Text>
                        <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
                        <BookOpen size={12} color={colors.neutral[400]} />
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                          className="text-xs ml-1"
                        >
                          {module.lessons} lessons
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View className="mt-2 flex-row items-center">
                        <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
                          <View
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: getProgressPercentage(module) === 100 ? colors.success : colors.primary[500],
                              width: `${getProgressPercentage(module)}%`
                            }}
                          />
                        </View>
                        <Text
                          style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }}
                          className="text-xs ml-2"
                        >
                          {getProgressPercentage(module)}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View className="justify-center pr-2">
                    <ChevronRight size={18} color={colors.neutral[400]} />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
            );
          })}
        </View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(600)}
          className="mx-6 mt-4 p-4 rounded-2xl"
          style={{ backgroundColor: colors.gold[100], borderWidth: 1, borderColor: colors.gold[200] }}
        >
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[800] }}
            className="text-base"
          >
            Review & Retention
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[700] }}
            className="text-sm mt-1"
          >
            Use these modules and video demonstrations to review what you learned in-person.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
