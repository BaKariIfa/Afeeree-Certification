import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Check, FileText, StickyNote, ExternalLink, Lock, ChevronRight, Timer, X, Play, Video } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockModules } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import { useResourcesStore } from '@/lib/resourcesStore';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import DiscussionForum from '@/components/DiscussionForum';

// Minimum session length to be recorded toward participation
const MIN_STUDY_MS = 15 * 60 * 1000;
// Total participation required per module (240 min)
const MODULE_REQUIRED_MS = 240 * 60 * 1000;

const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

function formatStudyTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ModuleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [pdfViewed, setPdfViewed] = useState(false);
  const [videoWatching, setVideoWatching] = useState(false);

  // In-memory session start times: lessonIndex → timestamp when current session started
  // Using a ref so unmount cleanup can access the latest value without stale closure
  const sessionStartRef = useRef<Map<number, number>>(new Map());
  const [sessionStart, setSessionStart] = useState<Map<number, number>>(new Map());

  // Tick every second while sheet is open to update the displayed time
  const [, setTick] = useState(0);

  const completedLessons = useUserStore(s => s.completedLessons);
  const notes = useUserStore(s => s.notes);
  const lessonStudyTime = useUserStore(s => s.lessonStudyTime);
  const markLessonComplete = useUserStore(s => s.markLessonComplete);
  const saveNote = useUserStore(s => s.saveNote);
  const addLessonStudyTime = useUserStore(s => s.addLessonStudyTime);
  const participantCode = useUserStore(s => s.accessCode) ?? 'guest';
  const participantName = useUserStore(s => s.name) ?? 'Kalanden';

  const historyPdfUrl = useResourcesStore(s => s.historyPdfUrl);
  const loadResources = useResourcesStore(s => s.loadResources);

  useEffect(() => { loadResources(); }, []);

  const module = mockModules.find(m => m.id === id);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (module && notes[module.id]) setNoteText(notes[module.id]);
  }, [module, notes]);

  // Tick every second while a lesson sheet is open
  useEffect(() => {
    if (selectedLesson === null) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [selectedLesson]);

  // Save all active session times on unmount
  useEffect(() => {
    return () => {
      const mod = mockModules.find(m => m.id === id);
      if (!mod) return;
      sessionStartRef.current.forEach((startTime, lessonIndex) => {
        const elapsed = Date.now() - startTime;
        // Only record sessions lasting at least 15 minutes
        if (elapsed >= MIN_STUDY_MS) {
          addLessonStudyTime(`${mod.id}-${lessonIndex}`, elapsed);
        }
      });
    };
  }, [id]);

  if (!fontsLoaded || !module) return null;

  const lessonCount = module.lessons;
  const completedCount = completedLessons.filter(l => l.startsWith(`${module.id}-`)).length;
  const progressPercent = Math.round((completedCount / lessonCount) * 100);
  const totalContactHoursLogged = Object.entries(lessonStudyTime)
    .filter(([k]) => k.startsWith(`${module.id}-`))
    .reduce((sum, [, ms]) => sum + ms, 0);

  const isLessonComplete = (i: number) => completedLessons.includes(`${module.id}-${i}`);

  // Video time already logged for this module
  const videoTimeMs = lessonStudyTime[`${module.id}-video`] ?? 0;

  // Total study time for a lesson = persisted + current session elapsed
  const getTotalStudyMs = (lessonIndex: number): number => {
    const key = `${module.id}-${lessonIndex}`;
    const persisted = lessonStudyTime[key] ?? 0;
    const start = sessionStart.get(lessonIndex);
    const sessionElapsed = start ? Date.now() - start : 0;
    return persisted + sessionElapsed;
  };

  const saveCurrentSession = (lessonIndex: number) => {
    const start = sessionStartRef.current.get(lessonIndex);
    if (start !== undefined) {
      const elapsed = Date.now() - start;
      // Only record sessions lasting at least 15 minutes
      if (elapsed >= MIN_STUDY_MS) addLessonStudyTime(`${module.id}-${lessonIndex}`, elapsed);
      sessionStartRef.current.delete(lessonIndex);
      setSessionStart(prev => {
        const next = new Map(prev);
        next.delete(lessonIndex);
        return next;
      });
    }
  };

  const handleLessonPress = (lessonIndex: number) => {
    triggerHaptic();
    setPdfViewed(false);
    setSelectedLesson(lessonIndex);
    // Auto-start session timer as soon as the lesson opens
    if (!sessionStartRef.current.has(lessonIndex)) {
      const now = Date.now();
      sessionStartRef.current.set(lessonIndex, now);
      setSessionStart(prev => new Map([...prev, [lessonIndex, now]]));
    }
  };

  const handleCloseSheet = () => {
    if (selectedLesson !== null) saveCurrentSession(selectedLesson);
    setSelectedLesson(null);
  };

  const handleViewNotation = async (lessonIndex?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const backendUrl = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';
    let pageUrl: string | null = null;
    if (module.isHistoryModule && historyPdfUrl) {
      const lessonPage = lessonIndex !== undefined ? module.lessonPages?.[lessonIndex] : null;
      const start = lessonPage?.startPage ?? 1;
      const end = lessonPage?.endPage ?? 999;
      pageUrl = `${backendUrl}/api/notation/view?url=${encodeURIComponent(historyPdfUrl)}&startPage=${start}&endPage=${end}`;
    } else if (module.pdfLink && module.pdfPage) {
      pageUrl = `${backendUrl}/api/notation/view?url=${encodeURIComponent(module.pdfLink)}&startPage=${module.pdfPage}&endPage=${module.pdfEndPage ?? module.pdfPage}`;
    }
    if (pageUrl) {
      await WebBrowser.openBrowserAsync(pageUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    }
    setPdfViewed(true);
  };

  // Track how long the video browser was open and record as participation
  const handleWatchModuleVideo = async () => {
    if (!module.videoUrl || videoWatching) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const start = Date.now();
    setVideoWatching(true);
    try {
      await WebBrowser.openBrowserAsync(module.videoUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
    } catch {}
    setVideoWatching(false);
    const elapsed = Date.now() - start;
    // Record any video session ≥ 15 minutes toward module participation
    if (elapsed >= MIN_STUDY_MS) {
      addLessonStudyTime(`${module.id}-video`, elapsed);
    }
  };

  const handleMarkComplete = () => {
    if (selectedLesson === null) return;
    saveCurrentSession(selectedLesson);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markLessonComplete(module.id, selectedLesson);
    if (completedCount + 1 === lessonCount) setShowConfetti(true);
    setSelectedLesson(null);
  };

  const handleNotesPress = () => { triggerHaptic(); setShowNotes(true); };
  const handleSaveNote = () => { triggerHaptic(); saveNote(module.id, noteText); setShowNotes(false); };

  // Derived values for selected lesson
  const studyMs = selectedLesson !== null ? getTotalStudyMs(selectedLesson) : 0;
  const studyProgress = Math.min(studyMs / MIN_STUDY_MS, 1);
  const timerReached = studyMs >= MIN_STUDY_MS;
  const canMarkComplete = timerReached;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <ConfettiCelebration visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Image */}
        <View className="relative">
          <Image source={module.localImage || { uri: module.imageUrl }} style={{ width: '100%', height: 250 }} contentFit="cover" />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </View>

        <View className="px-6 -mt-6">
          {/* Module Info Card */}
          <Animated.View entering={FadeInUp.duration(500)} className="p-5 rounded-2xl"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
            <View className="flex-row items-center mb-3">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary[100] }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }} className="text-sm">{module.category}</Text>
              </View>
              {module.notationRef && (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600] }} className="text-sm ml-3">{module.notationRef}</Text>
              )}
            </View>

            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }} className="text-2xl">{module.title}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], lineHeight: 22 }} className="text-base mt-3">{module.description}</Text>

            <View className="flex-row items-center mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.neutral[200] }}>
              <Clock size={16} color={colors.neutral[400]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm ml-2">{module.duration}</Text>
              <View className="mx-3 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
              <BookOpen size={16} color={colors.neutral[400]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm ml-2">{lessonCount} lessons</Text>
              <View className="mx-3 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
              <Timer size={16} color={colors.neutral[400]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm ml-2">240 min required</Text>
            </View>

            {/* Completion progress */}
            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700] }} className="text-sm">Progress</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: progressPercent === 100 ? colors.success : colors.primary[500] }} className="text-sm">
                  {completedCount}/{lessonCount} lessons
                </Text>
              </View>
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
                <View className="h-full rounded-full" style={{ backgroundColor: progressPercent === 100 ? colors.success : colors.primary[500], width: `${progressPercent}%` }} />
              </View>
            </View>

            {/* Participation progress toward 240 min */}
            <View className="mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.neutral[100] }}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Timer size={13} color={totalContactHoursLogged >= MODULE_REQUIRED_MS ? colors.success : colors.gold[500]} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: totalContactHoursLogged >= MODULE_REQUIRED_MS ? colors.success : colors.gold[700], fontSize: 12, marginLeft: 5 }}>
                    Documented Participation
                  </Text>
                </View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: totalContactHoursLogged >= MODULE_REQUIRED_MS ? colors.success : colors.neutral[600] }}>
                  {formatStudyTime(totalContactHoursLogged)} / 4:00:00
                </Text>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.neutral[100], overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 3, backgroundColor: totalContactHoursLogged >= MODULE_REQUIRED_MS ? colors.success : colors.gold[400], width: `${Math.min(totalContactHoursLogged / MODULE_REQUIRED_MS * 100, 100)}%` }} />
              </View>
              {totalContactHoursLogged === 0 && (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginTop: 5 }}>
                  Sessions of 15+ min count toward 240 min total
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Notes Button */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} className="mt-4">
            <Pressable onPress={handleNotesPress} className="flex-row items-center justify-center py-4 rounded-xl" style={{ backgroundColor: colors.gold[500] }}>
              <StickyNote size={20} color="white" />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-base ml-2">Notes</Text>
            </Pressable>
          </Animated.View>

          {/* Video Resource Card */}
          {module.videoUrl && (
            <Animated.View entering={FadeInUp.duration(500).delay(150)} className="mt-4">
              <Pressable
                onPress={handleWatchModuleVideo}
                disabled={videoWatching}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#0D1117',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                {/* Dark cinematic header */}
                <View style={{ paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    {videoWatching
                      ? <ActivityIndicator size="small" color="white" />
                      : <Play size={22} color="white" fill="white" />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}>
                      Video Lesson
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>
                      {videoWatching ? 'Opening video…' : videoTimeMs > 0
                        ? `${formatStudyTime(videoTimeMs)} watched — counts toward participation`
                        : 'Watch to earn documented participation time'}
                    </Text>
                  </View>
                  {!videoWatching && (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 12 }}>Watch</Text>
                    </View>
                  )}
                </View>

                {/* Progress bar if time has been logged */}
                {videoTimeMs > 0 && (
                  <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <View style={{ height: '100%', borderRadius: 2, backgroundColor: videoTimeMs >= MODULE_REQUIRED_MS ? '#10B981' : colors.gold[400], width: `${Math.min(videoTimeMs / MODULE_REQUIRED_MS * 100, 100)}%` }} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>
                      {formatStudyTime(videoTimeMs)} / 4:00:00 module target
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* Lessons List */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-lg">Lessons</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }} className="text-xs">15 min min. per lesson</Text>
            </View>

            {Array.from({ length: lessonCount }, (_, i) => {
              const complete = isLessonComplete(i);
              const studiedMs = getTotalStudyMs(i);
              const hasStudied = studiedMs > 0;
              const lessonDone = studiedMs >= MIN_STUDY_MS;
              const lessonTitle = module.lessonPages?.[i]?.title ?? `Lesson ${i + 1}`;
              const pageRange = module.lessonPages?.[i] ? `pp. ${module.lessonPages[i].startPage}–${module.lessonPages[i].endPage}` : null;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleLessonPress(i)}
                  className="flex-row items-center p-4 mb-2 rounded-xl"
                  style={{ backgroundColor: 'white', borderWidth: 1, borderColor: complete ? colors.success : hasStudied ? colors.gold[300] : colors.neutral[200] }}
                >
                  <View className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: complete ? colors.success : hasStudied ? colors.gold[100] : colors.neutral[100] }}>
                    {complete ? <Check size={18} color="white" /> : hasStudied
                      ? <Timer size={15} color={colors.gold[600]} />
                      : <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500] }} className="text-sm">{i + 1}</Text>
                    }
                  </View>
                  <View className="flex-1 ml-3">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: complete ? colors.success : colors.neutral[700] }} className="text-base">
                        {lessonTitle}
                      </Text>
                      {pageRange && !complete && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.neutral[100] }}>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.neutral[400] }}>{pageRange}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: complete ? colors.success : hasStudied ? colors.gold[700] : colors.neutral[400] }}>
                      {complete ? 'Completed' : hasStudied
                        ? `${formatStudyTime(studiedMs)} studied${lessonDone ? ' — ready to complete' : ''}`
                        : module.isHistoryModule ? 'Tap to open readings & begin study' : 'Tap to open notation & begin study'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={complete ? colors.success : colors.neutral[300]} />
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed back button — always visible regardless of scroll */}
      <Pressable
        onPress={() => { triggerHaptic(); router.back(); }}
        style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowLeft size={22} color="white" />
      </Pressable>

      {/* Lesson Detail Sheet */}
      {selectedLesson !== null && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <Pressable style={{ flex: 1 }} onPress={handleCloseSheet} />
            <Animated.View entering={FadeInUp.duration(300)}
              style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' }}>

              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 }}>
                <Pressable onPress={handleCloseSheet} hitSlop={12}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#1C1917' }}>
                  <X size={14} color="white" />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13, marginLeft: 4 }}>Close</Text>
                </Pressable>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300] }} />
                <View style={{ width: 70 }} />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 32 }}
              >
                {isLessonComplete(selectedLesson) ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Check size={30} color={colors.success} />
                    </View>
                    <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 20, marginBottom: 4 }}>
                      Lesson {selectedLesson + 1} Complete
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
                      {formatStudyTime(getTotalStudyMs(selectedLesson))} of documented participation recorded.
                    </Text>
                    {(module.pdfLink || (module.isHistoryModule && historyPdfUrl)) && (
                      <Pressable onPress={() => handleViewNotation(selectedLesson)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary[300], backgroundColor: colors.primary[50] }}>
                        <ExternalLink size={18} color={colors.primary[500]} />
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600], fontSize: 15, marginLeft: 10 }}>
                          {module.isHistoryModule ? 'Review History & Context' : 'Review Notation PDF'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22, marginBottom: 4 }}>
                      {module.lessonPages?.[selectedLesson]?.title ?? `Lesson ${selectedLesson + 1}`}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
                      {module.isHistoryModule
                        ? 'Open the readings to study. A minimum of 15 minutes is required before marking complete — take as long as you need.'
                        : 'Open the notation PDF to study. A minimum of 15 minutes is required before marking complete — take as long as you need.'}
                    </Text>

                    {/* Step 1 — Open PDF */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: pdfViewed ? colors.success : colors.primary[500], alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 12 }}>
                        {pdfViewed
                          ? <Check size={14} color="white" />
                          : <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>1</Text>
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 15, marginBottom: 8 }}>
                          {module.isHistoryModule ? 'Study the readings' : 'Study the notation'}
                        </Text>
                        {(module.pdfLink || (module.isHistoryModule && historyPdfUrl)) ? (
                          <Pressable onPress={() => handleViewNotation(selectedLesson)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: pdfViewed ? colors.primary[50] : colors.primary[500], borderWidth: pdfViewed ? 1 : 0, borderColor: colors.primary[200], marginBottom: module.videoUrl ? 10 : 0 }}>
                            <FileText size={18} color={pdfViewed ? colors.primary[500] : 'white'} />
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: pdfViewed ? colors.primary[600] : 'white', fontSize: 15, marginLeft: 10, flex: 1 }}>
                              {pdfViewed
                                ? (module.isHistoryModule ? 'Reopen History & Context' : 'Reopen Notation PDF')
                                : (module.isHistoryModule ? 'Open History & Context' : 'Open Notation PDF')}
                            </Text>
                            <ExternalLink size={14} color={pdfViewed ? colors.primary[400] : 'rgba(255,255,255,0.7)'} />
                          </Pressable>
                        ) : (
                          <View style={{ paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.neutral[100], marginBottom: module.videoUrl ? 10 : 0 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14 }}>No notation file attached</Text>
                          </View>
                        )}
                        {/* Video option inside lesson sheet */}
                        {module.videoUrl && (
                          <Pressable
                            onPress={handleWatchModuleVideo}
                            disabled={videoWatching}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#0D1117' }}
                          >
                            {videoWatching
                              ? <ActivityIndicator size="small" color="white" />
                              : <Play size={16} color="white" fill="white" />
                            }
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 15, marginLeft: 10, flex: 1 }}>
                              {videoWatching ? 'Opening…' : 'Watch Video Lesson'}
                            </Text>
                            <Video size={14} color="rgba(255,255,255,0.6)" />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Study time tracker */}
                    <View style={{ marginBottom: 20, padding: 16, borderRadius: 16, backgroundColor: timerReached ? colors.success + '10' : colors.gold[50], borderWidth: 1, borderColor: timerReached ? colors.success + '40' : colors.gold[200] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Timer size={15} color={timerReached ? colors.success : colors.gold[600]} />
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: timerReached ? colors.success : colors.gold[700], fontSize: 14, marginLeft: 8 }}>
                            {timerReached ? 'Participation documented' : 'Documenting participation'}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: timerReached ? colors.success : colors.gold[700], fontSize: 15 }}>
                          {formatStudyTime(studyMs)}
                        </Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: timerReached ? colors.success + '30' : colors.gold[200], overflow: 'hidden' }}>
                        <View style={{ height: '100%', borderRadius: 3, backgroundColor: timerReached ? colors.success : colors.gold[500], width: `${studyProgress * 100}%` }} />
                      </View>
                      {!timerReached && (
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600], fontSize: 12, marginTop: 8 }}>
                          {formatStudyTime(MIN_STUDY_MS - studyMs)} more to unlock completion
                        </Text>
                      )}
                    </View>

                    {/* Step 2 — Mark Complete */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: canMarkComplete ? colors.primary[500] : colors.neutral[200], alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 12 }}>
                        {canMarkComplete
                          ? <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>2</Text>
                          : <Lock size={12} color={colors.neutral[400]} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: canMarkComplete ? colors.neutral[700] : colors.neutral[400], fontSize: 15, marginBottom: 8 }}>
                          Record lesson completion
                        </Text>
                        <Pressable
                          onPress={canMarkComplete ? handleMarkComplete : undefined}
                          style={{ paddingVertical: 15, borderRadius: 12, alignItems: 'center', backgroundColor: canMarkComplete ? colors.success : colors.neutral[100] }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: canMarkComplete ? 'white' : colors.neutral[400], fontSize: 16 }}>
                            {canMarkComplete ? 'Mark Lesson Complete ✓' : `${formatStudyTime(MIN_STUDY_MS - studyMs)} remaining`}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}

                {/* Discussion Forum — only for History & Context module */}
                {module.isHistoryModule && (
                  <DiscussionForum
                    moduleId={module.id}
                    lessonIndex={selectedLesson}
                    participantCode={participantCode}
                    participantName={participantName}
                  />
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Notes Modal */}
      {showNotes && (
        <View className="absolute inset-0 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable className="flex-1" onPress={() => setShowNotes(false)} />
          <Animated.View entering={FadeInUp.duration(300)} className="rounded-t-3xl p-6" style={{ backgroundColor: 'white', paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }} className="text-xl">Notes</Text>
              <Pressable onPress={handleSaveNote}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[500] }} className="text-base">Save</Text>
              </Pressable>
            </View>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your notes here..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[800], backgroundColor: colors.neutral[100], borderRadius: 12, padding: 16, height: 200, textAlignVertical: 'top' }}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}
