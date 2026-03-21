import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Linking, RefreshControl, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Clock, ChevronRight, Play, FileText, ArrowLeft, Video, Timer, BookOpenText, Lock, Upload, Globe, CheckCircle, Link } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

import { colors } from '@/lib/theme';
import { mockModules, resourceLinks, videoLinks } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import { useNotationStore } from '@/lib/notationStore';
import { useResourcesStore } from '@/lib/resourcesStore';
import { uploadFile } from '@/lib/upload';
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

  const researchDocUrl = useResourcesStore(s => s.researchDocUrl);
  const researchVideoId = useResourcesStore(s => s.researchVideoId);
  const setResearchDocUrl = useResourcesStore(s => s.setResearchDocUrl);
  const setResearchVideoId = useResourcesStore(s => s.setResearchVideoId);
  const loadResources = useResourcesStore(s => s.loadResources);

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoIdInput, setVideoIdInput] = useState('');
  const [videoIdSaved, setVideoIdSaved] = useState(false);

  // Load uploaded notation URL on mount
  React.useEffect(() => { loadNotationPdfUrl(); loadResources(); }, []);

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
    const params = new URLSearchParams({ url: pdfUrl });
    if (isDemoMode) params.set('maxPages', '5');
    const viewerUrl = `${BACKEND_URL}/api/notation/view?${params.toString()}`;
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
    triggerHaptic();
    setVideoModal({ vimeoId, title, subtitle });
  };

  const handleUploadResearchDoc = async () => {
    triggerHaptic();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setIsUploadingDoc(true);
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream');
      await setResearchDocUrl(uploaded.url);
      setDocUploadSuccess(true);
      setTimeout(() => setDocUploadSuccess(false), 3000);
    } catch (e) {
      console.error('[ResearchUpload]', e);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSaveVideoId = async () => {
    if (!videoIdInput.trim()) return;
    triggerHaptic();
    await setResearchVideoId(videoIdInput.trim());
    setVideoIdSaved(true);
    setShowVideoInput(false);
    setVideoIdInput('');
    setTimeout(() => setVideoIdSaved(false), 3000);
  };

  const handleModulePress = (module: Module, index: number) => {
    if (isDemoMode && index >= 2) return;
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
        previewMode={isDemoMode}
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
            <View className="gap-3">
              <View
                className="rounded-xl px-3 py-2 mb-1"
                style={{ backgroundColor: colors.gold[100], borderWidth: 1, borderColor: colors.gold[200] }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[700], fontSize: 12, textAlign: 'center' }}>
                  Preview: videos limited to 1 minute
                </Text>
              </View>
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
        <Animated.View entering={FadeInDown.duration(600).delay(85)} style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Pressable
            onPress={() => {
              triggerHaptic();
              setShowTerms(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.gold[100],
              }}
            >
              <BookOpenText size={20} color={colors.gold[600]} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                Mandinka Terms
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14 }}>
                Key vocabulary with pronunciation
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>

        {/* Research Materials Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(95)} style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 18, marginBottom: 12 }}>
            Research Materials
          </Text>

          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.neutral[200],
              overflow: 'hidden',
            }}
          >
            {/* Research Document Row */}
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: colors.primary[100],
                  }}
                >
                  <Globe size={20} color={colors.primary[500]} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                    Cultural Research Document
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>
                    {researchDocUrl ? 'Uploaded document available' : 'No document uploaded yet'}
                  </Text>
                </View>
                {researchDocUrl && (
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      const params = new URLSearchParams({ url: researchDocUrl });
                      WebBrowser.openBrowserAsync(`${BACKEND_URL}/api/notation/view?${params.toString()}`, {
                        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                      });
                    }}
                    style={{
                      backgroundColor: colors.primary[500],
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>Open</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={handleUploadResearchDoc}
                disabled={isUploadingDoc}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: docUploadSuccess ? colors.success : colors.primary[300],
                  borderStyle: 'dashed',
                  backgroundColor: docUploadSuccess ? 'rgba(34,197,94,0.06)' : colors.primary[50] ?? 'rgba(107,70,193,0.04)',
                }}
              >
                {isUploadingDoc ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : docUploadSuccess ? (
                  <>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.success, fontSize: 14, marginLeft: 6 }}>
                      Uploaded!
                    </Text>
                  </>
                ) : (
                  <>
                    <Upload size={16} color={colors.primary[500]} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 14, marginLeft: 6 }}>
                      {researchDocUrl ? 'Replace Document' : 'Upload Document'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Research Video Row */}
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: colors.gold[100],
                  }}
                >
                  <Video size={20} color={colors.gold[600]} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                    Research Video
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>
                    {researchVideoId ? `Vimeo: ${researchVideoId}` : 'No video linked yet'}
                  </Text>
                </View>
                {researchVideoId && (
                  <Pressable
                    onPress={() => openVideo(researchVideoId, 'Cultural Research', 'Seven Foundational Principles')}
                    style={{
                      backgroundColor: colors.gold[500],
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Play size={12} color="white" fill="white" />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13, marginLeft: 4 }}>Play</Text>
                  </Pressable>
                )}
              </View>

              {videoIdSaved && !showVideoInput && (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.success, fontSize: 14, marginLeft: 6 }}>
                    Video link saved!
                  </Text>
                </View>
              )}

              {showVideoInput ? (
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.neutral[100],
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Link size={16} color={colors.neutral[400]} />
                    <TextInput
                      value={videoIdInput}
                      onChangeText={setVideoIdInput}
                      placeholder="Vimeo ID (e.g. 123456789)"
                      placeholderTextColor={colors.neutral[400]}
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        color: colors.neutral[800],
                        flex: 1,
                        marginLeft: 8,
                        fontSize: 15,
                      }}
                      autoFocus
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => { setShowVideoInput(false); setVideoIdInput(''); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 12,
                        borderWidth: 1, borderColor: colors.neutral[300],
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], fontSize: 14 }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveVideoId}
                      disabled={!videoIdInput.trim()}
                      style={{
                        flex: 2, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: videoIdInput.trim() ? colors.primary[500] : colors.neutral[300],
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 14 }}>Save Video Link</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => { triggerHaptic(); setShowVideoInput(true); }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.gold[400],
                    borderStyle: 'dashed',
                    backgroundColor: 'rgba(245,158,11,0.04)',
                  }}
                >
                  <Link size={16} color={colors.gold[600]} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[600], fontSize: 14, marginLeft: 6 }}>
                    {researchVideoId ? 'Update Video Link' : 'Add Video Link'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
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
                onPress={() => isLocked ? null : handleModulePress(module, index)}
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
