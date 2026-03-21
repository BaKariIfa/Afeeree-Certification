import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Video,
  Users,
  PenLine,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Camera,
  File,
  ArrowLeft,
  CheckCircle,
  Trash2,
  Link,
  MessageSquare,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { colors } from '@/lib/theme';
import { mockAssignments } from '@/lib/mockData';
import type { Assignment } from '@/lib/types';
import DemoBanner from '@/components/DemoBanner';
import { useUserStore } from '@/lib/userStore';
import { uploadFile } from '@/lib/upload';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const statusFilters = ['All', 'Pending', 'Submitted', 'Graded'] as const;

interface MySubmission {
  id: string;
  assignmentTitle: string;
  type: 'video' | 'file' | 'reflection';
  fileUrl?: string;
  fileName?: string;
  reflection?: string;
  submittedAt: string;
}

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskView, setTaskView] = useState<'detail' | 'submit-options' | 'reflection'>('detail');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  // My submissions state
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [loadingMySubmissions, setLoadingMySubmissions] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isDemoMode = useUserStore(s => s.isDemoMode);
  const accessCode = useUserStore(s => s.accessCode);
  const userName = useUserStore(s => s.name);
  const incrementCompletedTasks = useUserStore(s => s.incrementCompletedTasks);

  const submitToBackend = async (type: 'video' | 'file' | 'reflection', fileUrl?: string, fileName?: string, reflection?: string) => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      await fetch(`${BACKEND_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantCode: accessCode,
          participantName: userName || 'Kalanden',
          assignmentTitle: selectedAssignment.title,
          type,
          fileUrl,
          fileName,
          reflection,
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setTaskView('detail');
      incrementCompletedTasks();
      if (selectedAssignment) fetchMySubmissions(selectedAssignment.title);
      setTimeout(() => { setSubmitted(false); closeModal(); }, 2500);
    } catch (e) {
      console.error('[assignments submitToBackend]', e);
      Alert.alert('Submission Failed', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMySubmissions = async (assignmentTitle: string) => {
    if (!accessCode) return;
    setLoadingMySubmissions(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/my/${accessCode}`);
      const data = await res.json() as { submissions: MySubmission[] };
      setMySubmissions(data.submissions.filter(s => s.assignmentTitle === assignmentTitle));
    } catch (e) {
      console.error('[fetchMySubmissions]', e);
    } finally {
      setLoadingMySubmissions(false);
    }
  };

  const deleteSubmission = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`${BACKEND_URL}/api/submissions/${id}`, { method: 'DELETE' });
      setMySubmissions(prev => prev.filter(s => s.id !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[deleteSubmission]', e);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleRecordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 120, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const uploaded = await uploadFile(asset.uri, `submission-${Date.now()}.mp4`, 'video/mp4');
      await submitToBackend('video', uploaded.url, `video-${Date.now()}.mp4`);
    } catch {
      Alert.alert('Upload Failed', 'Please try again.');
    }
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream');
      await submitToBackend('file', uploaded.url, asset.name);
    } catch {
      Alert.alert('Upload Failed', 'Please try again.');
    }
  };

  const handleSubmitReflection = async () => {
    if (!reflectionText.trim()) return;
    await submitToBackend('reflection', undefined, undefined, reflectionText.trim());
    setReflectionText('');
  };

  const onRefresh = useCallback(() => {
    triggerHaptic();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const navigateWithHaptic = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const handleFilterPress = (filter: string) => {
    Haptics.selectionAsync();
    setSelectedFilter(filter);
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

  const filteredAssignments = selectedFilter === 'All'
    ? mockAssignments
    : mockAssignments.filter(a => {
        if (selectedFilter === 'Pending') return a.status === 'pending';
        if (selectedFilter === 'Submitted') return a.status === 'submitted';
        if (selectedFilter === 'Graded') return a.status === 'graded' || a.status === 'resubmit';
        return true;
      });

  const getTypeIcon = (type: Assignment['type']) => {
    switch (type) {
      case 'video':
        return <Video size={20} color={colors.primary[500]} />;
      case 'document':
        return <FileText size={20} color={colors.primary[500]} />;
      case 'teaching_demo':
        return <Users size={20} color={colors.primary[500]} />;
      case 'reflection':
        return <PenLine size={20} color={colors.primary[500]} />;
    }
  };

  const getStatusConfig = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={16} color={colors.gold[600]} />, color: colors.gold[600], bg: colors.gold[100], label: 'Pending' };
      case 'submitted':
        return { icon: <CheckCircle2 size={16} color={colors.info} />, color: colors.info, bg: '#EBF5FF', label: 'Submitted' };
      case 'graded':
        return { icon: <CheckCircle2 size={16} color={colors.success} />, color: colors.success, bg: '#ECFDF5', label: 'Graded' };
      case 'resubmit':
        return { icon: <AlertCircle size={16} color={colors.warning} />, color: colors.warning, bg: '#FFF7ED', label: 'Resubmit' };
    }
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssignment(assignment);
    setTaskView('detail');
    setMySubmissions([]);
    setConfirmDeleteId(null);
    setModalVisible(true);
    if (!isDemoMode) {
      fetchMySubmissions(assignment.title);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmitPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTaskView('submit-options');
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
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center">
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
                Tasks
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                className="text-base mt-1"
              >
                Submit your work and track progress
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Status Filter */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6"
            contentContainerStyle={{ paddingRight: 24 }}
            style={{ flexGrow: 0 }}
          >
            {statusFilters.map((filter) => (
              <Pressable
                key={filter}
                onPress={() => handleFilterPress(filter)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedFilter === filter ? colors.primary[500] : 'white',
                  borderWidth: 1,
                  borderColor: selectedFilter === filter ? colors.primary[500] : colors.neutral[200],
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    color: selectedFilter === filter ? 'white' : colors.neutral[600]
                  }}
                  className="text-sm"
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Assignments List */}
        <View className="px-6 mt-6">
          {filteredAssignments.map((assignment, index) => {
            const statusConfig = getStatusConfig(assignment.status);
            return (
              <Animated.View
                key={assignment.id}
                entering={FadeInUp.duration(500).delay(200 + index * 80)}
              >
                <Pressable
                  onPress={() => handleAssignmentPress(assignment)}
                  className="mb-4 p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-start">
                    {/* Type Icon */}
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.primary[100] }}
                    >
                      {getTypeIcon(assignment.type)}
                    </View>

                    {/* Content */}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center justify-between">
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }}
                          className="text-base flex-1"
                          numberOfLines={1}
                        >
                          {assignment.title}
                        </Text>
                        <View
                          className="px-2 py-1 rounded-full flex-row items-center ml-2"
                          style={{ backgroundColor: statusConfig.bg }}
                        >
                          {statusConfig.icon}
                          <Text
                            style={{ fontFamily: 'DMSans_500Medium', color: statusConfig.color }}
                            className="text-xs ml-1"
                          >
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}
                        className="text-sm mt-1"
                      >
                        {assignment.moduleName}
                      </Text>

                      <View className="flex-row items-center mt-3">
                        {assignment.grade && (
                          <Text
                            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }}
                            className="text-xs"
                          >
                            Grade: {assignment.grade}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Assignment Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
        onDismiss={() => { setSelectedAssignment(null); setTaskView('detail'); setReflectionText(''); }}
      >
        <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
          {!selectedAssignment ? null : (<>
          <View className="px-6 pt-4 pb-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-lg">
              Task Details
            </Text>
            <Pressable onPress={closeModal} className="p-2">
              <X size={24} color={colors.neutral[600]} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
            <View>
                {/* Status Badge */}
                <View
                  className="self-start px-3 py-1.5 rounded-full flex-row items-center"
                  style={{ backgroundColor: getStatusConfig(selectedAssignment.status).bg }}
                >
                  {getStatusConfig(selectedAssignment.status).icon}
                  <Text
                    style={{ fontFamily: 'DMSans_500Medium', color: getStatusConfig(selectedAssignment.status).color }}
                    className="text-sm ml-1"
                  >
                    {getStatusConfig(selectedAssignment.status).label}
                  </Text>
                </View>

                {/* Title */}
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }}
                  className="text-2xl mt-4"
                >
                  {selectedAssignment.title}
                </Text>

                {/* Module */}
                <Text
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500] }}
                  className="text-base mt-2"
                >
                  {selectedAssignment.moduleName}
                </Text>

                {/* Description */}
                <Text
                  style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600] }}
                  className="text-base mt-4 leading-6"
                >
                  {selectedAssignment.description}
                </Text>

                {/* Details Card */}
                {selectedAssignment.grade && (
                  <View
                    className="mt-6 p-4 rounded-xl"
                    style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
                  >
                    <View className="flex-row justify-between py-2">
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }}>
                        Grade
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }}>
                        {selectedAssignment.grade}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Feedback */}
                {selectedAssignment.feedback && (
                  <View
                    className="mt-4 p-4 rounded-xl"
                    style={{ backgroundColor: colors.success + '15', borderWidth: 1, borderColor: colors.success + '30' }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success }} className="text-sm mb-1">
                      Jeli Feedback
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.success, fontSize: 10, fontStyle: 'italic', marginBottom: 8, opacity: 0.8 }}>
                      A respected transmitter of history, culture, and embodied wisdom
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700] }} className="text-base leading-6">
                      {selectedAssignment.feedback}
                    </Text>
                  </View>
                )}
                {/* My Submissions */}
                {!isDemoMode && (
                  <View className="mt-6 mb-2">
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1 }} className="uppercase mb-3">
                      Your Submissions
                    </Text>

                    {loadingMySubmissions ? (
                      <ActivityIndicator size="small" color={colors.primary[400]} />
                    ) : mySubmissions.length === 0 ? (
                      <View
                        className="p-4 rounded-xl items-center"
                        style={{ backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200] }}
                      >
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14 }}>
                          No submissions yet
                        </Text>
                      </View>
                    ) : (
                      mySubmissions.map((sub) => (
                        <View
                          key={sub.id}
                          className="mb-3 p-4 rounded-xl"
                          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
                        >
                          {/* Type badge */}
                          <View className="flex-row items-center justify-between mb-2">
                            <View
                              className="px-2 py-1 rounded-full flex-row items-center"
                              style={{
                                backgroundColor: sub.type === 'video' ? colors.primary[100] : sub.type === 'file' ? colors.gold[100] : colors.neutral[100]
                              }}
                            >
                              {sub.type === 'video' && <Video size={13} color={colors.primary[500]} />}
                              {sub.type === 'file' && <File size={13} color={colors.gold[600]} />}
                              {sub.type === 'reflection' && <MessageSquare size={13} color={colors.neutral[600]} />}
                              <Text
                                style={{
                                  fontFamily: 'DMSans_600SemiBold',
                                  fontSize: 11,
                                  marginLeft: 4,
                                  color: sub.type === 'video' ? colors.primary[600] : sub.type === 'file' ? colors.gold[700] : colors.neutral[600],
                                }}
                              >
                                {sub.type === 'video' ? 'Video' : sub.type === 'file' ? 'File' : 'Reflection'}
                              </Text>
                            </View>

                            {/* Delete */}
                            {confirmDeleteId === sub.id ? (
                              <View className="flex-row items-center" style={{ gap: 8 }}>
                                <Pressable
                                  onPress={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1 rounded-full"
                                  style={{ backgroundColor: colors.neutral[100] }}
                                >
                                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], fontSize: 12 }}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => deleteSubmission(sub.id)}
                                  className="px-3 py-1 rounded-full flex-row items-center"
                                  style={{ backgroundColor: colors.error + '18' }}
                                >
                                  {deletingId === sub.id ? (
                                    <ActivityIndicator size="small" color={colors.error} />
                                  ) : (
                                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.error, fontSize: 12 }}>Delete</Text>
                                  )}
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() => { triggerHaptic(); setConfirmDeleteId(sub.id); }}
                                className="p-1.5 rounded-full"
                                style={{ backgroundColor: colors.neutral[100] }}
                              >
                                <Trash2 size={15} color={colors.neutral[500]} />
                              </Pressable>
                            )}
                          </View>

                          {/* Content */}
                          {sub.reflection ? (
                            <Text
                              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], fontSize: 14, lineHeight: 20 }}
                              numberOfLines={3}
                            >
                              {sub.reflection}
                            </Text>
                          ) : sub.fileUrl ? (
                            <Pressable
                              onPress={async () => { triggerHaptic(); await WebBrowser.openBrowserAsync(sub.fileUrl!); }}
                              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[100], borderRadius: 8, padding: 10 }}
                            >
                              <Link size={13} color={colors.primary[500]} />
                              <Text
                                style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginLeft: 6, flex: 1 }}
                                numberOfLines={1}
                              >
                                {sub.fileName ?? 'View file'}
                              </Text>
                              <ExternalLink size={13} color={colors.primary[400]} />
                            </Pressable>
                          ) : null}

                          {confirmDeleteId === sub.id && (
                            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.error, fontSize: 12, marginTop: 8 }}>
                              Are you sure you want to delete this submission?
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom action area — changes based on taskView */}
            {taskView === 'detail' && selectedAssignment.status === 'pending' && (
              <View className="px-6 pb-8 pt-4" style={{ backgroundColor: colors.cream[100] }}>
                <Pressable
                  onPress={isDemoMode ? undefined : handleSubmitPress}
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: isDemoMode ? colors.neutral[300] : colors.primary[500] }}
                >
                  <Upload size={20} color="white" />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-base ml-2">
                    {isDemoMode ? 'Enroll to Submit' : 'Submit Task'}
                  </Text>
                </Pressable>
              </View>
            )}

            {taskView === 'submit-options' && (
              <View style={{ backgroundColor: colors.cream[100], borderTopWidth: 1, borderTopColor: colors.neutral[200] }}>
                <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 17 }}>Choose Submission Type</Text>
                  <Pressable onPress={() => setTaskView('detail')} className="p-2">
                    <X size={22} color={colors.neutral[600]} />
                  </Pressable>
                </View>
                {submitting ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                    <ActivityIndicator size="large" color={colors.primary[500]} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], marginTop: 12, fontSize: 15 }}>Uploading...</Text>
                  </View>
                ) : (
                  <View className="px-6 pb-8">
                    <Pressable onPress={handleRecordVideo} className="p-4 rounded-2xl mb-3 flex-row items-center" style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}>
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                        <Camera size={24} color={colors.primary[500]} />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>Record Video</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>Capture teaching demos or practice</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={handleUploadFile} className="p-4 rounded-2xl mb-3 flex-row items-center" style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}>
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                        <File size={24} color={colors.gold[600]} />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>Upload File</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>Documents, videos, or images</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => setTaskView('reflection')} className="p-4 rounded-2xl flex-row items-center" style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}>
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                        <PenLine size={24} color={colors.primary[500]} />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>Write Reflection</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>Text-based response</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {taskView === 'reflection' && (
              <View style={{ backgroundColor: colors.cream[100], borderTopWidth: 1, borderTopColor: colors.neutral[200], paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 17 }}>Write Your Reflection</Text>
                  <Pressable onPress={() => { setTaskView('submit-options'); setReflectionText(''); }} className="p-2">
                    <X size={22} color={colors.neutral[600]} />
                  </Pressable>
                </View>
                <TextInput
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  placeholder="Share your thoughts and insights..."
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    color: colors.neutral[800],
                    backgroundColor: 'white',
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 15,
                    lineHeight: 22,
                    minHeight: 120,
                    borderWidth: 1,
                    borderColor: colors.neutral[200],
                    textAlignVertical: 'top',
                    marginBottom: 12,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => { setTaskView('submit-options'); setReflectionText(''); }}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: colors.neutral[100] }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 15 }}>Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSubmitReflection}
                    disabled={!reflectionText.trim() || submitting}
                    style={{ flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: reflectionText.trim() ? colors.primary[500] : colors.neutral[200] }}
                  >
                    {submitting
                      ? <ActivityIndicator size="small" color="white" />
                      : <Text style={{ fontFamily: 'DMSans_600SemiBold', color: reflectionText.trim() ? 'white' : colors.neutral[400], fontSize: 15 }}>Submit</Text>
                    }
                  </Pressable>
                </View>
              </View>
            )}
          </>)}
        </View>
      </Modal>

      {/* Submission Success overlay */}
      {submitted && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 32, alignItems: 'center', width: 260 }}>
            <CheckCircle size={56} color={colors.success} />
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 20, marginTop: 16, textAlign: 'center' }}>
              Submitted!
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              Your Jeli will review it shortly.
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
