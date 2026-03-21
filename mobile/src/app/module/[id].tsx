import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Check, FileText, StickyNote, ExternalLink, Lock, ChevronRight, Timer } from 'lucide-react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockModules } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import ConfettiCelebration from '@/components/ConfettiCelebration';

const MIN_STUDY_MS = 15 * 60 * 1000; // 15 minutes

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ModuleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Lesson detail sheet
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  // Tracks which lessons had their notation opened (stores start timestamp)
  const [lessonTimerStart, setLessonTimerStart] = useState<Map<number, number>>(new Map());
  // Live tick to force re-render every second while sheet is open
  const [, setTick] = useState(0);

  // Animated progress bar value (0→1)
  const timerProgress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%` as `${number}%`,
  }));

  const completedLessons = useUserStore(s => s.completedLessons);
  const notes = useUserStore(s => s.notes);
  const markLessonComplete = useUserStore(s => s.markLessonComplete);
  const saveNote = useUserStore(s => s.saveNote);

  const module = mockModules.find(m => m.id === id);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (module && notes[module.id]) {
      setNoteText(notes[module.id]);
    }
  }, [module, notes]);

  // Tick every second while the sheet is open and a timer is running
  useEffect(() => {
    if (selectedLesson === null) return;
    const startTime = lessonTimerStart.get(selectedLesson);
    if (!startTime) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / MIN_STUDY_MS, 1);
      timerProgress.value = progress;
      if (elapsed >= MIN_STUDY_MS) {
        clearInterval(interval);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedLesson, lessonTimerStart]);

  // Sync progress bar when sheet opens with existing timer
  useEffect(() => {
    if (selectedLesson === null) return;
    const startTime = lessonTimerStart.get(selectedLesson);
    if (!startTime) {
      timerProgress.value = 0;
      return;
    }
    const elapsed = Date.now() - startTime;
    timerProgress.value = Math.min(elapsed / MIN_STUDY_MS, 1);
  }, [selectedLesson]);

  if (!fontsLoaded || !module) {
    return null;
  }

  const lessonCount = module.lessons;
  const completedCount = completedLessons.filter(l => l.startsWith(`${module.id}-`)).length;
  const progressPercent = Math.round((completedCount / lessonCount) * 100);

  const isLessonComplete = (lessonIndex: number) =>
    completedLessons.includes(`${module.id}-${lessonIndex}`);

  const getTimeRemaining = (lessonIndex: number): number => {
    const startTime = lessonTimerStart.get(lessonIndex);
    if (!startTime) return MIN_STUDY_MS;
    return Math.max(0, MIN_STUDY_MS - (Date.now() - startTime));
  };

  const handleLessonPress = (lessonIndex: number) => {
    triggerHaptic();
    setSelectedLesson(lessonIndex);
  };

  const handleViewNotation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (module.pdfLink && module.pdfPage) {
      const backendUrl = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';
      const pageUrl = `${backendUrl}/api/notation/view?url=${encodeURIComponent(module.pdfLink)}&startPage=${module.pdfPage}&endPage=${module.pdfEndPage ?? module.pdfPage}`;
      Linking.openURL(pageUrl);
    }
    if (selectedLesson !== null && !lessonTimerStart.has(selectedLesson)) {
      // Start 15-min timer the first time the notation is opened
      const now = Date.now();
      setLessonTimerStart(prev => new Map([...prev, [selectedLesson, now]]));
      timerProgress.value = withTiming(1, {
        duration: MIN_STUDY_MS,
        easing: Easing.linear,
      });
    }
  };

  const handleMarkComplete = () => {
    if (selectedLesson === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markLessonComplete(module.id, selectedLesson);
    const newCompletedCount = completedCount + 1;
    if (newCompletedCount === lessonCount) {
      setShowConfetti(true);
    }
    setSelectedLesson(null);
  };

  const handleNotesPress = () => {
    triggerHaptic();
    setShowNotes(true);
  };

  const handleSaveNote = () => {
    triggerHaptic();
    saveNote(module.id, noteText);
    setShowNotes(false);
  };

  const notationOpened = selectedLesson !== null && lessonTimerStart.has(selectedLesson);
  const timeRemainingMs = selectedLesson !== null ? getTimeRemaining(selectedLesson) : MIN_STUDY_MS;
  const timerDone = timeRemainingMs <= 0;
  const canMarkComplete = notationOpened && timerDone;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <ConfettiCelebration
        visible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Image */}
        <View className="relative">
          <Image
            source={module.localImage || { uri: module.imageUrl }}
            style={{ width: '100%', height: 250 }}
            contentFit="cover"
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <Pressable
            onPress={() => { triggerHaptic(); router.back(); }}
            className="absolute p-3 rounded-full"
            style={{ top: insets.top + 8, left: 16, backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <ArrowLeft size={24} color="white" />
          </Pressable>
        </View>

        {/* Content */}
        <View className="px-6 -mt-6">
          <Animated.View
            entering={FadeInUp.duration(500)}
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
          >
            <View className="flex-row items-center mb-3">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary[100] }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }} className="text-sm">
                  {module.category}
                </Text>
              </View>
              {module.notationRef && (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600] }} className="text-sm ml-3">
                  {module.notationRef}
                </Text>
              )}
            </View>

            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }} className="text-2xl">
              {module.title}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], lineHeight: 22 }} className="text-base mt-3">
              {module.description}
            </Text>

            <View className="flex-row items-center mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.neutral[200] }}>
              <Clock size={16} color={colors.neutral[400]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm ml-2">{module.duration}</Text>
              <View className="mx-3 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
              <BookOpen size={16} color={colors.neutral[400]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm ml-2">{lessonCount} lessons</Text>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700] }} className="text-sm">Progress</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: progressPercent === 100 ? colors.success : colors.primary[500] }} className="text-sm">
                  {completedCount}/{lessonCount} completed
                </Text>
              </View>
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
                <View className="h-full rounded-full" style={{ backgroundColor: progressPercent === 100 ? colors.success : colors.primary[500], width: `${progressPercent}%` }} />
              </View>
            </View>
          </Animated.View>

          {/* Notes Button */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} className="mt-4">
            <Pressable
              onPress={handleNotesPress}
              className="flex-row items-center justify-center py-4 rounded-xl"
              style={{ backgroundColor: colors.gold[500] }}
            >
              <StickyNote size={20} color="white" />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-base ml-2">Notes</Text>
            </Pressable>
          </Animated.View>

          {/* Lessons List */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-lg">Lessons</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }} className="text-xs">Tap to view notation</Text>
            </View>

            {Array.from({ length: lessonCount }, (_, i) => {
              const complete = isLessonComplete(i);
              const timerStarted = lessonTimerStart.has(i);
              const remaining = getTimeRemaining(i);
              const done = remaining <= 0;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleLessonPress(i)}
                  className="flex-row items-center p-4 mb-2 rounded-xl"
                  style={{ backgroundColor: 'white', borderWidth: 1, borderColor: complete ? colors.success : timerStarted && !done ? colors.gold[300] : colors.neutral[200] }}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: complete ? colors.success : timerStarted && !done ? colors.gold[100] : colors.neutral[100] }}
                  >
                    {complete ? (
                      <Check size={18} color="white" />
                    ) : timerStarted && !done ? (
                      <Timer size={16} color={colors.gold[600]} />
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500] }} className="text-sm">{i + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: complete ? colors.success : colors.neutral[700] }} className="text-base">
                      Lesson {i + 1}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: complete ? colors.success : timerStarted && !done ? colors.gold[600] : colors.neutral[400] }}>
                      {complete ? 'Completed' : timerStarted && !done ? `${formatCountdown(remaining)} remaining` : 'Tap to view notation & mark complete'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={complete ? colors.success : colors.neutral[300]} />
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Lesson Detail Sheet */}
      {selectedLesson !== null && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSelectedLesson(null)} />
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral[200], alignSelf: 'center', marginBottom: 20 }} />

            {isLessonComplete(selectedLesson) ? (
              /* Already complete */
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Check size={30} color={colors.success} />
                </View>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 20, marginBottom: 4 }}>
                  Lesson {selectedLesson + 1} Complete
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, textAlign: 'center' }}>
                  You have already completed this lesson. You can still review the notation.
                </Text>
                {module.pdfLink && (
                  <Pressable
                    onPress={handleViewNotation}
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary[300], backgroundColor: colors.primary[50] }}
                  >
                    <ExternalLink size={18} color={colors.primary[500]} />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600], fontSize: 15, marginLeft: 10 }}>
                      Review Notation PDF
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              /* Not yet complete */
              <>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22, marginBottom: 4 }}>
                  Lesson {selectedLesson + 1}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
                  Study the notation for at least 15 minutes, then mark the lesson complete.
                </Text>

                {/* Step 1 — Open Notation */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: notationOpened ? colors.success : colors.primary[500],
                    alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 12,
                  }}>
                    {notationOpened
                      ? <Check size={14} color="white" />
                      : <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>1</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 15, marginBottom: 8 }}>
                      Open &amp; study the notation
                    </Text>
                    {module.pdfLink ? (
                      <Pressable
                        onPress={handleViewNotation}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
                          backgroundColor: notationOpened ? colors.primary[50] : colors.primary[500],
                          borderWidth: notationOpened ? 1 : 0,
                          borderColor: colors.primary[200],
                        }}
                      >
                        <FileText size={18} color={notationOpened ? colors.primary[500] : 'white'} />
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: notationOpened ? colors.primary[600] : 'white', fontSize: 15, marginLeft: 10, flex: 1 }}>
                          {notationOpened ? 'Reopen Notation PDF' : 'Open Notation PDF'}
                        </Text>
                        <ExternalLink size={14} color={notationOpened ? colors.primary[400] : 'rgba(255,255,255,0.7)'} />
                      </Pressable>
                    ) : (
                      <View style={{ paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.neutral[100] }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14 }}>No notation file attached</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Study Timer (shown after opening notation) */}
                {notationOpened && (
                  <View style={{ marginBottom: 20, padding: 16, borderRadius: 16, backgroundColor: timerDone ? colors.success + '12' : colors.gold[50], borderWidth: 1, borderColor: timerDone ? colors.success + '40' : colors.gold[200] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Timer size={16} color={timerDone ? colors.success : colors.gold[600]} />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: timerDone ? colors.success : colors.gold[700], fontSize: 14, marginLeft: 8 }}>
                        {timerDone ? 'Minimum study time reached' : `Study time: ${formatCountdown(timeRemainingMs)} remaining`}
                      </Text>
                    </View>
                    {/* Progress track */}
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: timerDone ? colors.success + '30' : colors.gold[200], overflow: 'hidden' }}>
                      <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: timerDone ? colors.success : colors.gold[500] }, progressStyle]} />
                    </View>
                    {!timerDone && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600], fontSize: 12, marginTop: 8 }}>
                        Keep the notation open to study. The timer tracks your engagement.
                      </Text>
                    )}
                  </View>
                )}

                {/* Step 2 — Mark Complete */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: canMarkComplete ? colors.primary[500] : colors.neutral[200],
                    alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 12,
                  }}>
                    {canMarkComplete
                      ? <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>2</Text>
                      : <Lock size={12} color={colors.neutral[400]} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: canMarkComplete ? colors.neutral[700] : colors.neutral[400], fontSize: 15, marginBottom: 8 }}>
                      Mark as complete
                    </Text>
                    <Pressable
                      onPress={canMarkComplete ? handleMarkComplete : undefined}
                      style={{ paddingVertical: 15, borderRadius: 12, alignItems: 'center', backgroundColor: canMarkComplete ? colors.success : colors.neutral[100] }}
                    >
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: canMarkComplete ? 'white' : colors.neutral[400], fontSize: 16 }}>
                        {canMarkComplete ? 'Mark Lesson Complete ✓' : notationOpened ? `Wait ${formatCountdown(timeRemainingMs)}` : 'Open notation first'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}

      {/* Notes Modal */}
      {showNotes && (
        <View className="absolute inset-0 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable className="flex-1" onPress={() => setShowNotes(false)} />
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: 'white', paddingBottom: insets.bottom + 24 }}
          >
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
