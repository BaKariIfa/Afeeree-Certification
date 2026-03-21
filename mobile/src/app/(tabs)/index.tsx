import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Trophy, Clock, ChevronRight, Bell, Home, FileText, User, Library, MessageCircle, CreditCard, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';

import { colors } from '@/lib/theme';
import { mockModules, mockAssignments, mockNotifications } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import { ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import DemoBanner from '@/components/DemoBanner';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

// Helper function for haptic feedback on button press
const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userName = useUserStore(s => s.name);
  const isOnboarded = useUserStore(s => s.isOnboarded);
  const hasAccess = useUserStore(s => s.hasAccess);
  const loadUserData = useUserStore(s => s.loadUserData);

  useEffect(() => {
    const checkOnboarding = async () => {
      await loadUserData();
      setIsLoading(false);
    };
    checkOnboarding();
  }, [loadUserData]);

  useEffect(() => {
    // Initial routing is handled by `src/app/start.tsx` to avoid redirect loops.
  }, [isLoading, hasAccess, isOnboarded, router]);

  const isDemoMode = useUserStore(s => s.isDemoMode);

  const [unreadFeedback, setUnreadFeedback] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/unread-count`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (!res.ok) return;
      const data = await res.json() as { count: number };
      setUnreadFeedback(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const onRefresh = useCallback(() => {
    triggerHaptic();
    setRefreshing(true);
    loadUserData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [loadUserData]);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending').length;
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;
  const inProgressModule = mockModules.find(m => m.completedLessons > 0 && m.completedLessons < m.lessons);

  // Navigation with haptic feedback
  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
      <DemoBanner />
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
        {/* Header with Background Image */}
        <View style={{ position: 'relative' }}>
          <ImageBackground
            source={require('../../../public/image-1769399578.jpeg')}
            style={{ paddingTop: isDemoMode ? 16 : insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Bell Icon */}
            <Animated.View
              entering={FadeInDown.duration(600)}
              className="flex-row justify-end"
            >
              <Pressable
                className="relative p-2"
                onPress={() => triggerHaptic()}
              >
                <Bell size={24} color="white" />
                {unreadNotifications > 0 && (
                  <View
                    className="absolute top-1 right-1 w-4 h-4 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.gold[500] }}
                  >
                    <Text className="text-[10px] text-white font-bold">{unreadNotifications}</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Logo - Afeeree app icon */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(100)}
              className="items-center mt-2"
            >
              <Image
                source={require('../../../public/image-1769399524.png')}
                style={{ width: 140, height: 140, borderRadius: 70 }}
                contentFit="cover"
              />
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)' }}
                className="text-sm mt-3 text-center"
              >
                The Physical Language
              </Text>
            </Animated.View>
          </ImageBackground>
        </View>

        {/* Menu Bar - Navigation Icons */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(150)}
          className="mx-6 -mt-5 rounded-2xl p-3"
          style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
        >
          <View className="flex-row justify-around items-center">
            <Pressable
              className="items-center py-2 px-3"
              onPress={() => navigateWithHaptic('/(tabs)/')}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                <Home size={20} color={colors.primary[500]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }} className="text-xs mt-1">Home</Text>
            </Pressable>

            <Pressable
              className="items-center py-2 px-3"
              onPress={() => navigateWithHaptic('/(tabs)/syllabus')}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
                <BookOpen size={20} color={colors.neutral[500]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }} className="text-xs mt-1">Syllabus</Text>
            </Pressable>

            <Pressable
              className="items-center py-2 px-3"
              onPress={() => navigateWithHaptic('/(tabs)/feedback')}
            >
              <View style={{ position: 'relative' }}>
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
                  <MessageCircle size={20} color={colors.neutral[500]} />
                </View>
                {unreadFeedback > 0 && (
                  <View style={{
                    position: 'absolute', top: -2, right: -2,
                    backgroundColor: colors.primary[500], borderRadius: 8,
                    minWidth: 16, height: 16, paddingHorizontal: 3,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 9 }}>{unreadFeedback}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }} className="text-xs mt-1">Feedback</Text>
            </Pressable>

            <Pressable
              className="items-center py-2 px-3"
              onPress={() => navigateWithHaptic('/(tabs)/resources')}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
                <Library size={20} color={colors.neutral[500]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }} className="text-xs mt-1">Resources</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Enroll Banner — only shown to unenrolled visitors */}
        {!hasAccess && (
        <Animated.View entering={FadeInDown.duration(600).delay(180)} className="mx-6 mt-4">
          <Pressable
            onPress={() => navigateWithHaptic('/purchase')}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: colors.gold[600],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={[colors.gold[500], colors.gold[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 }}
            >
              <View
                className="w-11 h-11 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <CreditCard size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}>
                  Enroll Now — $600 CAD
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>
                  AFeeree Certification Program
                </Text>
              </View>
              <ArrowRight size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
        )}

        {/* Welcome Section - Simplified */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} className="px-6 mt-6">
          <View>
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-sm"
            >
              Welcome back, Participant
            </Text>
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-xl"
            >
              {userName || 'Participant'}
            </Text>
          </View>
        </Animated.View>

        {/* Continue Learning Section */}
        {inProgressModule && (
          <Animated.View entering={FadeInDown.duration(600).delay(250)} className="px-6 mt-6">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-xl mb-4"
            >
              Continue Learning
            </Text>
            <Pressable
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
              onPress={() => navigateWithHaptic('/(tabs)/syllabus')}
            >
              <View className="p-4">
                <View className="flex-row items-center mb-2">
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: colors.primary[100] }}
                  >
                    <Text
                      style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                      className="text-xs"
                    >
                      {inProgressModule.category}
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }}
                    className="text-xs ml-2"
                  >
                    {inProgressModule.duration}
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                  className="text-lg"
                >
                  {inProgressModule.title}
                </Text>
                <View className="flex-row items-center mt-3">
                  <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: colors.primary[500],
                        width: `${(inProgressModule.completedLessons / inProgressModule.lessons) * 100}%`
                      }}
                    />
                  </View>
                  <Text
                    style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500] }}
                    className="text-xs ml-3"
                  >
                    {inProgressModule.completedLessons}/{inProgressModule.lessons} lessons
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Upcoming Assignments */}
        {mockAssignments.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(350)} className="px-6 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                className="text-xl"
              >
                Upcoming Assignments
              </Text>
              <Pressable
                className="flex-row items-center"
                onPress={() => navigateWithHaptic('/(tabs)/assignments')}
              >
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                  className="text-sm"
                >
                  See All
                </Text>
                <ChevronRight size={16} color={colors.primary[500]} />
              </Pressable>
            </View>

            {mockAssignments
              .filter(a => a.status === 'pending')
              .slice(0, 2)
              .map((assignment, index) => (
                <Animated.View
                  key={assignment.id}
                  entering={FadeInRight.duration(500).delay(400 + index * 100)}
                >
                  <Pressable
                    className="mb-3 p-4 rounded-xl flex-row items-center"
                    style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
                    onPress={() => navigateWithHaptic('/(tabs)/assignments')}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.gold[100] }}
                    >
                      <Clock size={24} color={colors.gold[600]} />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text
                        style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                        className="text-base"
                        numberOfLines={1}
                      >
                        {assignment.title}
                      </Text>
                      <Text
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                        className="text-sm mt-0.5"
                      >
                        Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.neutral[400]} />
                  </Pressable>
                </Animated.View>
              ))}
          </Animated.View>
        )}

        {/* Biography */}
        <Animated.View entering={FadeInDown.duration(600).delay(450)} className="px-6 mt-8 mb-4">
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
          >
            {/* Header with photo and name */}
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={{ padding: 20, alignItems: 'center' }}
            >
              <View
                className="rounded-full overflow-hidden"
                style={{ width: 120, height: 120, borderWidth: 3, borderColor: colors.gold[400] }}
              >
                <Image
                  source={{ uri: 'https://images.composerapi.com/019bf7ad-8916-75b9-9874-b6c49473f082/assets/images/image_1769406156_1769406156713_019bf8d3-4fa9-7153-80c2-ff455157e01f.jpg' }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.gold[300] }}
                className="text-2xl mt-4 text-center"
              >
                BaKari IfaSegun Lindsay
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[400] }}
                className="text-sm mt-2 text-center"
              >
                Director & Legacy Keeper
              </Text>
            </LinearGradient>

            {/* Biography content */}
            <View className="p-5">
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], lineHeight: 22 }}
                className="text-sm"
              >
                Born in Trinidad, West Indies, BaKari IfaSegun Lindsay has honed his diverse talents over more than three decades as a dancer, choreographer, singer, musician, costume designer/maker, and researcher. His work is deeply rooted in African and Caribbean traditions while embracing contemporary performance practices.
              </Text>

              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], lineHeight: 22 }}
                className="text-sm mt-4"
              >
                Trained at the Alvin Ailey American Dance Theatre and The School of Toronto Dance Theatre (on scholarship), BaKari further enriched his craft under the guidance of master teachers from the Caribbean and Africa. He holds a Master's Degree in Dance Ethnology, a Bachelor's in Education from York University, Canada, and a Craftsman Diploma in Style and Design.
              </Text>

              <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.gold[50] }}>
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary[500], fontStyle: 'italic', lineHeight: 24 }}
                  className="text-base text-center"
                >
                  "A-Feeree – The Physical Language: His master's thesis led to the development of an innovative training method that underpins his approach to Africanist movement aesthetics."
                </Text>
              </View>

              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], lineHeight: 22 }}
                className="text-sm mt-4"
              >
                A co-founder of the Collective Of Black Artists (COBA), BaKari has performed with renowned companies such as the Danny Grossman Dance Company, Jubilation Dance Co., Toronto Dance Theatre, and Artcho Danse Repertoire. Notably, he was an original cast member of Disney's The Lion King and was nominated for a Dora Mavor Moore Award for his solo performance in Ancestral Calling.
              </Text>

              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], lineHeight: 22 }}
                className="text-sm mt-4"
              >
                As a choreographer, he has created works for Les Enfants Dance Company, Entre Deux, The National Dance Company of Trinidad and Tobago, and COBA. His creative output includes choreographing dance films like "Rites," "Ase," and "Orisha Suite," and directing productions such as D'bi Young Anitafrika in "Esu Crossing the Middle Passage," which won a Dora Mavor Moore Award.
              </Text>

              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], lineHeight: 22 }}
                className="text-sm mt-4"
              >
                BaKari has shared his expertise at institutions including Toronto Metropolitan University (formerly Ryerson University), York University, Humber College, and the Lester B. Pearson School for the Performing Arts. Currently, he serves as a vice-principal with the Toronto District School Board, where he passionately advocates for equity and arts education.
              </Text>

              <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.gold[50] }}>
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.primary[500], fontStyle: 'italic', lineHeight: 24 }}
                  className="text-base text-center"
                >
                  "By seamlessly merging tradition with innovation, BaKari IfaSegun Lindsay continues to redefine Africanist movement aesthetics on the global stage."
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Due Soon Widget */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          className="px-6 mt-6 mb-4"
        >
          <View
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                <Clock size={20} color={colors.gold[600]} />
              </View>
              <View className="ml-3">
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-xl">
                  {pendingAssignments}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Due Soon
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row justify-around items-center py-3"
        style={{
          backgroundColor: 'white',
          paddingBottom: insets.bottom + 8,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={() => triggerHaptic()}
          className="items-center py-2 px-3"
        >
          <Home size={24} color={colors.primary[500]} />
          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }} className="text-xs mt-1">
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigateWithHaptic('/(tabs)/syllabus')}
          className="items-center py-2 px-3"
        >
          <Library size={24} color={colors.neutral[400]} />
          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-xs mt-1">
            Syllabus
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigateWithHaptic('/(tabs)/feedback')}
          className="items-center py-2 px-3"
        >
          <View style={{ position: 'relative' }}>
            <MessageCircle size={24} color={colors.neutral[400]} />
            {unreadFeedback > 0 && (
              <View style={{
                position: 'absolute', top: -4, right: -4,
                backgroundColor: colors.primary[500], borderRadius: 8,
                minWidth: 16, height: 16, paddingHorizontal: 3,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 9 }}>{unreadFeedback}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-xs mt-1">
            Feedback
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigateWithHaptic('/(tabs)/profile')}
          className="items-center py-2 px-3"
        >
          <User size={24} color={colors.neutral[400]} />
          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-xs mt-1">
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
