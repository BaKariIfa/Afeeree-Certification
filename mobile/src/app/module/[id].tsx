import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Check, FileText, StickyNote } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockModules } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import ConfettiCelebration from '@/components/ConfettiCelebration';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ModuleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

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

  if (!fontsLoaded || !module) {
    return null;
  }

  const lessonCount = module.lessons;
  const completedCount = completedLessons.filter(l => l.startsWith(`${module.id}-`)).length;
  const progressPercent = Math.round((completedCount / lessonCount) * 100);

  const isLessonComplete = (lessonIndex: number) => {
    return completedLessons.includes(`${module.id}-${lessonIndex}`);
  };

  const handleLessonToggle = (lessonIndex: number) => {
    triggerHaptic();

    if (!isLessonComplete(lessonIndex)) {
      markLessonComplete(module.id, lessonIndex);

      // Check if all lessons are now complete
      const newCompletedCount = completedCount + 1;
      if (newCompletedCount === lessonCount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
      }
    }
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

  const handleOpenPDF = () => {
    triggerHaptic();
    if (module.pdfLink) {
      Linking.openURL(module.pdfLink);
    }
  };

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
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
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
            style={{
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Category Badge */}
            <View className="flex-row items-center mb-3">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.primary[100] }}
              >
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                  className="text-sm"
                >
                  {module.category}
                </Text>
              </View>
              {module.notationRef && (
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600] }}
                  className="text-sm ml-3"
                >
                  {module.notationRef}
                </Text>
              )}
            </View>

            {/* Title */}
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-2xl"
            >
              {module.title}
            </Text>

            {/* Description */}
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], lineHeight: 22 }}
              className="text-base mt-3"
            >
              {module.description}
            </Text>

            {/* Meta Info */}
            <View className="flex-row items-center mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.neutral[200] }}>
              <Clock size={16} color={colors.neutral[400]} />
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm ml-2"
              >
                {module.duration}
              </Text>
              <View className="mx-3 w-1 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
              <BookOpen size={16} color={colors.neutral[400]} />
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-sm ml-2"
              >
                {lessonCount} lessons
              </Text>
            </View>

            {/* Progress */}
            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700] }}
                  className="text-sm"
                >
                  Progress
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: progressPercent === 100 ? colors.success : colors.primary[500] }}
                  className="text-sm"
                >
                  {completedCount}/{lessonCount} completed
                </Text>
              </View>
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: progressPercent === 100 ? colors.success : colors.primary[500],
                    width: `${progressPercent}%`,
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} className="flex-row mt-4">
            <Pressable
              onPress={handleOpenPDF}
              className="flex-1 flex-row items-center justify-center py-4 rounded-xl mr-2"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <FileText size={20} color="white" />
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                className="text-base ml-2"
              >
                View PDF
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNotesPress}
              className="flex-1 flex-row items-center justify-center py-4 rounded-xl ml-2"
              style={{ backgroundColor: colors.gold[500] }}
            >
              <StickyNote size={20} color="white" />
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                className="text-base ml-2"
              >
                Notes
              </Text>
            </Pressable>
          </Animated.View>

          {/* Lessons List */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="mt-6">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
              className="text-lg mb-4"
            >
              Lessons
            </Text>

            {Array.from({ length: lessonCount }, (_, i) => (
              <Pressable
                key={i}
                onPress={() => handleLessonToggle(i)}
                className="flex-row items-center p-4 mb-2 rounded-xl"
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: isLessonComplete(i) ? colors.success : colors.neutral[200],
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isLessonComplete(i) ? colors.success : colors.neutral[100],
                  }}
                >
                  {isLessonComplete(i) ? (
                    <Check size={18} color="white" />
                  ) : (
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500] }}
                      className="text-sm"
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    color: isLessonComplete(i) ? colors.success : colors.neutral[700],
                  }}
                  className="flex-1 ml-3 text-base"
                >
                  Lesson {i + 1}
                </Text>
                {isLessonComplete(i) && (
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.success }}
                    className="text-sm"
                  >
                    Completed
                  </Text>
                )}
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Notes Modal */}
      {showNotes && (
        <View
          className="absolute inset-0 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <Pressable className="flex-1" onPress={() => setShowNotes(false)} />
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: 'white', paddingBottom: insets.bottom + 24 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-xl"
              >
                Notes
              </Text>
              <Pressable onPress={handleSaveNote}>
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[500] }}
                  className="text-base"
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your notes here..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={{
                fontFamily: 'DMSans_400Regular',
                color: colors.neutral[800],
                backgroundColor: colors.neutral[100],
                borderRadius: 12,
                padding: 16,
                height: 200,
                textAlignVertical: 'top',
              }}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}
