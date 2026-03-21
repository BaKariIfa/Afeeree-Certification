import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Award,
  BookOpen,
  FileCheck,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
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
  Bell,
  Vibrate,
  X,
  MessageSquare,
  Check,
  Phone,
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

const PROFILE_IMAGE_KEY = 'user_profile_image';
const NOTIFICATIONS_KEY = 'notifications_enabled';
const HAPTICS_KEY = 'haptics_enabled';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const FAQ_ITEMS = [
  {
    q: 'How do I submit a task?',
    a: 'Go to the Tasks tab, tap on any task, then tap "Submit Task". You can upload a video, a file, or write a reflection depending on the task type.',
  },
  {
    q: 'When will I receive feedback on my submissions?',
    a: 'Your Jeli reviews submissions regularly. You will see feedback and a grade appear on the task once reviewed — typically within a few days.',
  },
  {
    q: 'How do I track my certification progress?',
    a: 'Your overall progress is shown at the top of this Profile screen. Complete lessons and submit tasks to advance toward your Foundation Certification.',
  },
  {
    q: 'Can I resubmit a task?',
    a: 'Yes. You can submit multiple times. Your Jeli will see all submissions and will assess the most recent one.',
  },
  {
    q: 'What if I forget my access code?',
    a: 'Contact your Jeli directly. They can look up your code from the Jeli panel and share it with you.',
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [nameSaved, setNameSaved] = useState(false);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // User store values
  const userName = useUserStore(s => s.name);
  const userEmail = useUserStore(s => s.email);
  const enrollmentDate = useUserStore(s => s.enrollmentDate);
  const completedLessons = useUserStore(s => s.completedLessons);
  const practiceTime = useUserStore(s => s.practiceTime);
  const darkMode = useUserStore(s => s.darkMode);
  const toggleDarkMode = useUserStore(s => s.toggleDarkMode);
  const isDemoMode = useUserStore(s => s.isDemoMode);
  const completedTasks = useUserStore(s => s.completedTasks);
  const logout = useUserStore(s => s.logout);

  useEffect(() => {
    loadProfileImage();
    loadPreferences();
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

  const loadPreferences = async () => {
    try {
      const [notifs, haptics] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(HAPTICS_KEY),
      ]);
      setNotificationsEnabled(notifs !== 'false');
      setHapticsEnabled(haptics !== 'false');
    } catch (error) {
      console.log('Error loading preferences:', error);
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
    setEditName(userName || '');
    setNameSaved(false);
    setShowSettingsModal(true);
  };

  const saveSettings = async () => {
    triggerHaptic();
    if (editName.trim() && editName.trim() !== userName) {
      useUserStore.getState().setUser(editName.trim(), userEmail);
    }
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, notificationsEnabled ? 'true' : 'false');
    await AsyncStorage.setItem(HAPTICS_KEY, hapticsEnabled ? 'true' : 'false');
    setNameSaved(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setNameSaved(false);
    }, 700);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const completedAssignments = completedTasks;

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
      title: 'Dedicated Kalanden',
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
      title: 'Task Achiever',
      description: 'Submit 5 tasks',
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

  const handleSignOut = async () => {
    triggerHaptic();
    await logout();
    router.replace(isDemoMode ? '/landing' : '/access-code');
  };

  const menuItems = [
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
      icon: <FileText size={22} color={colors.neutral[600]} />,
      label: 'Kalanden Agreement',
      subtitle: 'One who studies, absorbs, and prepares to carry forward tradition',
      onPress: () => { triggerHaptic(); router.push('/agreement'); }
    },
    {
      icon: <Settings size={22} color={colors.neutral[600]} />,
      label: 'Account Settings',
      onPress: handleSettingsPress
    },
    { icon: <HelpCircle size={22} color={colors.neutral[600]} />, label: 'Help & Support', onPress: () => { triggerHaptic(); setShowHelpModal(true); } },
    { icon: <LogOut size={22} color={colors.error} />, label: isDemoMode ? 'Exit Preview' : 'Sign Out', onPress: handleSignOut, isDestructive: true },
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
              {userName || 'Kalanden'}
            </Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2, textAlign: 'center' }}>
              Kalanden{' '}
              <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>— Carrier of Tradition</Text>
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
                  Tasks Done
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
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-sm">
                    {achievement.title === 'Dedicated Kalanden' ? (
                      <>
                        Dedicated Kalanden{' '}
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: colors.neutral[400], fontSize: 10 }}>— Carrier of Tradition</Text>
                      </>
                    ) : achievement.title}
                    {achievement.earned && (
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[500], fontSize: 10 }}>  ✦</Text>
                    )}
                  </Text>
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

        {/* Participant Agreement Card */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(350)}
          className="px-6 mt-6"
        >
          <Pressable
            onPress={() => { triggerHaptic(); router.push('/agreement'); }}
            className="p-4 rounded-2xl flex-row items-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <FileText size={20} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 15 }}>
                Kalanden Agreement{' '}
                <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>— Carrier of Tradition</Text>
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>
                View your signed agreement
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
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
                <View className="flex-1 ml-4">
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      color: item.isDestructive ? colors.error : colors.neutral[800]
                    }}
                    className="text-base"
                  >
                    {(item as any).subtitle
                      ? <>{item.label}{' '}<Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: colors.neutral[400], fontSize: 11 }}>— Carrier of Tradition</Text></>
                      : item.label
                    }
                  </Text>
                </View>
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

      {/* ── Account Settings Modal ── */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setShowSettingsModal(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 24,
              paddingTop: 16,
            }}
          >
            {/* Drag handle */}
            <View className="w-10 h-1 rounded-full self-center mb-5" style={{ backgroundColor: colors.neutral[200] }} />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22 }}>
                Account Settings
              </Text>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <X size={18} color={colors.neutral[600]} />
              </Pressable>
            </View>

            {/* Display Name */}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1 }} className="uppercase mb-2">
              Display Name
            </Text>
            <View
              className="flex-row items-center rounded-xl px-4 mb-6"
              style={{ backgroundColor: colors.neutral[50], borderWidth: 1.5, borderColor: colors.neutral[200], height: 52 }}
            >
              <User size={18} color={colors.neutral[400]} />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.neutral[400]}
                style={{ flex: 1, marginLeft: 10, fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.neutral[800] }}
                returnKeyType="done"
              />
            </View>

            {/* Preferences */}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1 }} className="uppercase mb-2">
              Preferences
            </Text>
            <View
              className="rounded-xl overflow-hidden mb-6"
              style={{ borderWidth: 1, borderColor: colors.neutral[200] }}
            >
              <View className="flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}>
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[100] }}>
                  <Bell size={18} color={colors.primary[500]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800], fontSize: 15, flex: 1 }}>
                  Notifications
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(v) => { triggerHaptic(); setNotificationsEnabled(v); }}
                  trackColor={{ false: colors.neutral[200], true: colors.primary[400] }}
                  thumbColor="white"
                />
              </View>
              <View className="flex-row items-center px-4 py-4">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.gold[100] }}>
                  <Vibrate size={18} color={colors.gold[600]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800], fontSize: 15, flex: 1 }}>
                  Haptic Feedback
                </Text>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(v) => { triggerHaptic(); setHapticsEnabled(v); }}
                  trackColor={{ false: colors.neutral[200], true: colors.primary[400] }}
                  thumbColor="white"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={saveSettings}
              className="rounded-2xl items-center justify-center py-4 flex-row"
              style={{ backgroundColor: nameSaved ? '#22C55E' : colors.primary[500] }}
            >
              {nameSaved ? (
                <Check size={20} color="white" />
              ) : (
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}>
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Help & Support Modal ── */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setShowHelpModal(false)}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '85%',
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <View className="w-10 h-1 rounded-full self-center mb-5" style={{ backgroundColor: colors.neutral[200] }} />
            <View className="flex-row items-center justify-between mb-6">
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22 }}>
                Help & Support
              </Text>
              <Pressable
                onPress={() => setShowHelpModal(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <X size={18} color={colors.neutral[600]} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            {/* FAQ */}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1 }} className="uppercase mb-3">
              Frequently Asked Questions
            </Text>
            <View className="rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: colors.neutral[200] }}>
              {FAQ_ITEMS.map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => { triggerHaptic(); setExpandedFaq(expandedFaq === i ? null : i); }}
                  style={{ borderBottomWidth: i < FAQ_ITEMS.length - 1 ? 1 : 0, borderBottomColor: colors.neutral[100] }}
                >
                  <View className="flex-row items-center px-4 py-4">
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800], fontSize: 14, flex: 1, lineHeight: 20 }}>
                      {item.q}
                    </Text>
                    <ChevronDown
                      size={18}
                      color={colors.neutral[400]}
                      style={{ transform: [{ rotate: expandedFaq === i ? '180deg' : '0deg' }] }}
                    />
                  </View>
                  {expandedFaq === i && (
                    <View className="px-4 pb-4">
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], fontSize: 14, lineHeight: 22 }}>
                        {item.a}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Contact */}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1, marginBottom: 12 }} className="uppercase">
              Contact Your Jeli{' '}
              <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: colors.neutral[400], fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>— Keeper of the Legacy</Text>
            </Text>
            <View className="rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: colors.neutral[200] }}>
              <View className="flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}>
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[100] }}>
                  <MessageSquare size={18} color={colors.primary[500]} />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                    In-App Messaging
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>
                    Use the Messages tab to reach your Jeli
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center px-4 py-4">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.gold[100] }}>
                  <Phone size={18} color={colors.gold[600]} />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                    Direct Contact
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>
                    bakari@afeeree.com
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
