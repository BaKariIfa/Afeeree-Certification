import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Award,
  BookOpen,
  FileCheck,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Calendar,
  ArrowLeft,
  Star,
  Target,
  Flame,
  Trophy,
  Camera,
  Moon,
  Sun,
  ShieldCheck,
  CreditCard
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/lib/theme';
import { mockModules, mockAssignments } from '@/lib/mockData';
import { useUserStore } from '@/lib/userStore';
import { AdminPanel } from '@/components/AdminPanel';
import { logSquareConfig } from '@/lib/squareConfig';

const PROFILE_IMAGE_KEY = 'user_profile_image';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // User store values
  const userName = useUserStore(s => s.name);
  const userEmail = useUserStore(s => s.email);
  const enrollmentDate = useUserStore(s => s.enrollmentDate);
  const completedLessons = useUserStore(s => s.completedLessons);
  const practiceTime = useUserStore(s => s.practiceTime);
  const darkMode = useUserStore(s => s.darkMode);
  const toggleDarkMode = useUserStore(s => s.toggleDarkMode);
  const logout = useUserStore(s => s.logout);

  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const saveProfileImage = async (uri: string) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
    } catch (error) {
      console.log('Error saving profile image:', error);
    }
  };

  const pickImage = async () => {
    triggerHaptic();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access media library was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      saveProfileImage(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onRefresh = () => {
    triggerHaptic();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const handleSettingsPress = () => {
    triggerHaptic();
    console.log('Opening settings...');
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

  // Calculate progress from user store
  const totalLessonsInCourse = mockModules.reduce((acc, m) => acc + m.lessons, 0);
  const totalLessons = completedLessons.length;
  const userProgress = totalLessonsInCourse > 0 ? Math.round((totalLessons / totalLessonsInCourse) * 100) : 0;

  // Calculate completed modules from user store
  const completedModules = mockModules.filter(m => {
    const moduleLessons = completedLessons.filter(l => l.startsWith(`${m.id}-`)).length;
    return moduleLessons === m.lessons && m.lessons > 0;
  }).length;

  const completedAssignments = mockAssignments.filter(a => a.status === 'graded').length;

  // Achievements data
  const achievements = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: <Star size={20} color={colors.gold[500]} />,
      earned: totalLessons >= 1,
      progress: Math.min(totalLessons, 1),
      total: 1
    },
    {
      id: 2,
      title: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      icon: <Target size={20} color={colors.primary[500]} />,
      earned: totalLessons >= 10,
      progress: Math.min(totalLessons, 10),
      total: 10
    },
    {
      id: 3,
      title: 'Module Master',
      description: 'Complete your first module',
      icon: <Award size={20} color={colors.gold[600]} />,
      earned: completedModules >= 1,
      progress: Math.min(completedModules, 1),
      total: 1
    },
    {
      id: 4,
      title: 'Assignment Ace',
      description: 'Submit 5 assignments',
      icon: <FileCheck size={20} color={colors.primary[500]} />,
      earned: completedAssignments >= 5,
      progress: Math.min(completedAssignments, 5),
      total: 5
    },
    {
      id: 5,
      title: 'On Fire',
      description: 'Study 7 days in a row',
      icon: <Flame size={20} color="#FF6B6B" />,
      earned: false,
      progress: 3,
      total: 7
    },
    {
      id: 6,
      title: 'Certification Ready',
      description: 'Complete all requirements',
      icon: <Trophy size={20} color={colors.gold[500]} />,
      earned: false,
      progress: userProgress,
      total: 100
    },
  ];

  const earnedCount = achievements.filter(a => a.earned).length;

  const testSquareConnection = () => {
    triggerHaptic();
    const config = logSquareConfig();
    if (config.isConfigured) {
      router.push('/purchase');
    } else {
      console.log('Square not configured - check ENV tab');
    }
  };

  const handleSignOut = async () => {
    triggerHaptic();
    await logout();
    router.replace('/access-code');
  };

  const menuItems = [
    {
      icon: <CreditCard size={22} color={colors.success} />,
      label: 'Test Square Payment',
      sublabel: 'Verify payment connection',
      onPress: testSquareConnection,
      isTest: true
    },
    {
      icon: <ShieldCheck size={22} color={colors.gold[600]} />,
      label: 'Admin Panel',
      sublabel: 'Manage access codes',
      onPress: () => {
        triggerHaptic();
        setShowAdminPanel(true);
      },
      isAdmin: true
    },
    {
      icon: darkMode ? <Sun size={22} color={colors.gold[500]} /> : <Moon size={22} color={colors.neutral[600]} />,
      label: darkMode ? 'Light Mode' : 'Dark Mode',
      onPress: () => {
        triggerHaptic();
        toggleDarkMode();
      },
      isToggle: true
    },
    {
      icon: <Settings size={22} color={colors.neutral[600]} />,
      label: 'Account Settings',
      onPress: handleSettingsPress
    },
    { icon: <HelpCircle size={22} color={colors.neutral[600]} />, label: 'Help & Support', onPress: () => triggerHaptic() },
    { icon: <LogOut size={22} color={colors.error} />, label: 'Sign Out', onPress: handleSignOut, isDestructive: true },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
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
        {/* Header with Profile */}
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          style={{ paddingTop: insets.top + 16, paddingBottom: 60, paddingHorizontal: 24 }}
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <Pressable
              onPress={() => navigateWithHaptic('/(tabs)/')}
              className="p-2 -ml-2 mb-2"
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600)} className="items-center">
            {/* Avatar - Tappable to change photo */}
            <Pressable onPress={pickImage} className="relative">
              <View
                className="w-24 h-24 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: colors.gold[400] }}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <User size={40} color="white" />
                )}
              </View>
              {/* Camera badge */}
              <View
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.gold[500], borderWidth: 2, borderColor: 'white' }}
              >
                <Camera size={14} color="white" />
              </View>
            </Pressable>

            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white' }}
              className="text-2xl"
            >
              {userName || 'Student'}
            </Text>

            <View
              className="mt-2 px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.gold[500] }}
            >
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }}
                className="text-sm"
              >
                Foundation Certification
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          className="px-6 -mt-10"
        >
          <View
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
            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.primary[100] }}>
                  <BookOpen size={24} color={colors.primary[500]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-xl">
                  {totalLessons}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Lessons Done
                </Text>
              </View>

              <View className="w-px h-16 self-center" style={{ backgroundColor: colors.neutral[200] }} />

              <View className="items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.gold[100] }}>
                  <Award size={24} color={colors.gold[600]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-xl">
                  {completedModules}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Modules
                </Text>
              </View>

              <View className="w-px h-16 self-center" style={{ backgroundColor: colors.neutral[200] }} />

              <View className="items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.primary[100] }}>
                  <FileCheck size={24} color={colors.primary[500]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-xl">
                  {completedAssignments}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Assignments
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Progress Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          className="px-6 mt-8"
        >
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-4"
          >
            Certification Progress
          </Text>

          <View
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                Overall Progress
              </Text>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[500] }} className="text-base">
                {userProgress}%
              </Text>
            </View>
            <View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.neutral[200] }}>
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.primary[500],
                  width: `${userProgress}%`
                }}
              />
            </View>
            <Text
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
              className="text-sm mt-3"
            >
              Complete {100 - userProgress}% more to achieve Foundation certification
            </Text>
          </View>
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(250)}
          className="px-6 mt-8"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
              className="text-xl"
            >
              Achievements
            </Text>
            <View className="flex-row items-center">
              <Trophy size={16} color={colors.gold[500]} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[600] }} className="text-sm ml-1">
                {earnedCount}/{achievements.length}
              </Text>
            </View>
          </View>

          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
          >
            {achievements.map((achievement, index) => (
              <View
                key={achievement.id}
                className="p-4 flex-row items-center"
                style={{
                  borderBottomWidth: index < achievements.length - 1 ? 1 : 0,
                  borderBottomColor: colors.neutral[100],
                  opacity: achievement.earned ? 1 : 0.6
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: achievement.earned ? colors.gold[100] : colors.neutral[100]
                  }}
                >
                  {achievement.icon}
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-sm">
                      {achievement.title}
                    </Text>
                    {achievement.earned && (
                      <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold[500] }}>
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: 'white' }} className="text-xs">
                          Earned
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs mt-0.5">
                    {achievement.description}
                  </Text>
                  {!achievement.earned && (
                    <View className="mt-2 flex-row items-center">
                      <View className="flex-1 h-1.5 rounded-full overflow-hidden mr-2" style={{ backgroundColor: colors.neutral[200] }}>
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: colors.primary[400],
                            width: `${(achievement.progress / achievement.total) * 100}%`
                          }}
                        />
                      </View>
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-xs">
                        {achievement.progress}/{achievement.total}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Account Info */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          className="px-6 mt-8"
        >
          <Text
            style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
            className="text-xl mb-4"
          >
            Account Information
          </Text>

          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
          >
            <View className="p-4 flex-row items-center border-b" style={{ borderBottomColor: colors.neutral[100] }}>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                <Mail size={20} color={colors.primary[500]} />
              </View>
              <View className="ml-4 flex-1">
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Email
                </Text>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800] }} className="text-base">
                  {userEmail || 'Not set'}
                </Text>
              </View>
            </View>

            <View className="p-4 flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                <Calendar size={20} color={colors.gold[600]} />
              </View>
              <View className="ml-4 flex-1">
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs">
                  Enrolled Since
                </Text>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800] }} className="text-base">
                  {enrollmentDate ? new Date(enrollmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(400)}
          className="px-6 mt-8"
        >
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
          >
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                className="p-4 flex-row items-center"
                style={{
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.neutral[100]
                }}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: item.isDestructive ? colors.error + '15' : colors.neutral[100] }}>
                  {item.icon}
                </View>
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    color: item.isDestructive ? colors.error : colors.neutral[800]
                  }}
                  className="flex-1 ml-4 text-base"
                >
                  {item.label}
                </Text>
                <ChevronRight size={20} color={colors.neutral[400]} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Version */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(500)}
          className="items-center mt-8"
        >
          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400] }} className="text-sm">
            AFeeree Certification App v1.0
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Admin Panel Modal */}
      <AdminPanel
        visible={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />
    </View>
  );
}
