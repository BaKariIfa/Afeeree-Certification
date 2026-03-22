import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, TextInput, Modal, Share, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Key, Plus, Copy, Trash2, Share2, ShieldCheck, Users, Check, FileText,
  Upload, CheckCircle, CreditCard, Globe, Video, MessageCircle, ArrowLeft,
  Send, ChevronRight, User, Inbox, PenLine,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

import { colors } from '@/lib/theme';
import { useAccessCodeStore, ADMIN_PASSWORD, AccessCode } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { useResourcesStore } from '@/lib/resourcesStore';
import { uploadFile } from '@/lib/upload';
import { logSquareConfig } from '@/lib/squareConfig';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { AudioMessage } from '@/components/AudioMessage';
import { VideoMessage } from '@/components/VideoMessage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

interface BackendMessage {
  id: string;
  senderId: 'participant' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  readByAdmin: boolean;
  readByParticipant: boolean;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
}

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminPanel({ visible, onClose }: AdminPanelProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploadingResearch, setIsUploadingResearch] = useState(false);
  const [researchUploadSuccess, setResearchUploadSuccess] = useState(false);
  const [videoIdInput, setVideoIdInput] = useState('');
  const [videoIdSaved, setVideoIdSaved] = useState(false);

  // Messages state
  const [adminView, setAdminView] = useState<'dashboard' | 'messages' | 'conversation' | 'submissions'>('dashboard');
  const [selectedConvCode, setSelectedConvCode] = useState<string | null>(null);
  const [selectedConvName, setSelectedConvName] = useState<string>('');
  const [convMessages, setConvMessages] = useState<BackendMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [convNewMessage, setConvNewMessage] = useState<string>('');
  const [isSendingConv, setIsSendingConv] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const convScrollRef = useRef<ScrollView>(null);

  // Submissions state
  interface Submission {
    id: string;
    participantCode: string;
    participantName: string;
    assignmentTitle: string;
    type: 'video' | 'file' | 'reflection';
    fileUrl?: string;
    fileName?: string;
    reflection?: string;
    submittedAt: string;
  }
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions`);
      if (res.ok) {
        const data = await res.json() as { submissions: Submission[] };
        setSubmissions(data.submissions.reverse());
      }
    } catch (e) {
      console.error('[AdminPanel fetchSubmissions]', e);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const codes = useAccessCodeStore(s => s.codes);
  const loadCodes = useAccessCodeStore(s => s.loadCodes);
  const generateCode = useAccessCodeStore(s => s.generateCode);
  const deleteCode = useAccessCodeStore(s => s.deleteCode);
  const setAdmin = useAccessCodeStore(s => s.setAdmin);

  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  const researchDocUrl = useResourcesStore(s => s.researchDocUrl);
  const researchVideoUrl = useResourcesStore(s => s.researchVideoUrl);
  const setResearchDocUrl = useResourcesStore(s => s.setResearchDocUrl);
  const setResearchVideoUrl = useResourcesStore(s => s.setResearchVideoUrl);
  const loadResources = useResourcesStore(s => s.loadResources);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  // ── Messaging functions ──

  const fetchUnreadCounts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/unread-counts`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json() as { counts: Record<string, number> };
        setUnreadCounts(data.counts);
      }
    } catch (e) {
      console.error('[AdminPanel fetchUnreadCounts]', e);
    }
  };

  const fetchConvMessages = async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${code}`);
      if (res.ok) {
        const data = await res.json() as { messages: BackendMessage[] };
        setConvMessages(data.messages);
        setTimeout(() => convScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('[AdminPanel fetchConvMessages]', e);
    }
  };

  const markConvRead = async (code: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/messages/${code}/read`, {
        method: 'POST',
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      setUnreadCounts(prev => ({ ...prev, [code]: 0 }));
    } catch (e) {
      console.error('[AdminPanel markConvRead]', e);
    }
  };

  const handleSendConvMessage = async () => {
    if (!convNewMessage.trim() || !selectedConvCode) return;
    setIsSendingConv(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${selectedConvCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'admin',
          senderName: 'BaKari Lindsay',
          text: convNewMessage.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json() as { message: BackendMessage };
        setConvMessages(prev => [...prev, data.message]);
        setConvNewMessage('');
        setTimeout(() => convScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('[AdminPanel handleSendConvMessage]', e);
    } finally {
      setIsSendingConv(false);
    }
  };

  const handleSendConvMedia = async (mediaUrl: string, mediaType: 'audio' | 'video') => {
    if (!selectedConvCode) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${selectedConvCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: 'admin', senderName: 'BaKari Lindsay', text: '', mediaUrl, mediaType }),
      });
      if (res.ok) {
        const data = await res.json() as { message: BackendMessage };
        setConvMessages(prev => [...prev, data.message]);
        setTimeout(() => convScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('[AdminPanel handleSendConvMedia]', e);
    }
  };

  const handleSendConvVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 60, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const uploaded = await uploadFile(asset.uri, `video-${Date.now()}.mp4`, 'video/mp4');
      await handleSendConvMedia(uploaded.url, 'video');
    } catch (e) {
      console.error('[AdminPanel handleSendConvVideo]', e);
    }
  };

  // ── Effects ──

  useEffect(() => {
    if (visible && isAuthenticated) {
      loadCodes();
      loadNotationPdfUrl();
      loadResources();
      fetchUnreadCounts();
    }
  }, [visible, isAuthenticated, loadCodes]);

  useEffect(() => {
    if (!visible) {
      setIsAuthenticated(false);
      setPassword('');
      setPasswordError('');
      setUploadSuccess(false);
      setResearchUploadSuccess(false);
      setVideoIdInput('');
      setVideoIdSaved(false);
      setAdminView('dashboard');
      setSelectedConvCode(null);
      setConvMessages([]);
      setUnreadCounts({});
      setConvNewMessage('');
    }
  }, [visible]);

  // Poll unread counts on messages list view
  useEffect(() => {
    if (!isAuthenticated || adminView !== 'messages') return;
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminView]);

  // Poll conversation messages on conversation view
  useEffect(() => {
    if (!isAuthenticated || adminView !== 'conversation' || !selectedConvCode) return;
    const interval = setInterval(() => fetchConvMessages(selectedConvCode), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminView, selectedConvCode]);

  // ── Handlers ──

  const handleLogin = () => {
    if (password.toUpperCase() === ADMIN_PASSWORD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
      setPasswordError('');
      setAdmin(true);
      loadCodes();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasswordError('Incorrect password');
    }
  };

  const handleGenerateCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCode = await generateCode();
    await Clipboard.setStringAsync(newCode);
    setCopiedCode(newCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyCode = async (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareCode = async (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Your AFeeree Certification access code is: ${code}\n\nDownload the app and enter this code to get started.`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleDeleteCode = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Code',
      `Are you sure you want to delete code ${code}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCode(code),
        },
      ]
    );
  };

  const handleUploadNotation = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const uploaded = await uploadFile(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/pdf'
      );
      await setNotationPdfUrl(uploaded.url);
      setUploadSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadResearch = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploadingResearch(true);
    setResearchUploadSuccess(false);
    try {
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
      await setResearchDocUrl(uploaded.url);
      setResearchUploadSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setResearchUploadSuccess(false), 4000);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploadingResearch(false);
    }
  };

  const handleSaveVideoId = async () => {
    const id = videoIdInput.trim();
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setResearchVideoUrl(id);
    setVideoIdSaved(true);
    setTimeout(() => setVideoIdSaved(false), 3000);
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  const participants = codes.filter(c => c.userName);

  if (!fontsLoaded) return null;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderCodeItem = (item: AccessCode) => (
    <Animated.View
      key={item.code}
      entering={FadeInDown.duration(300)}
      className="p-4 mb-3 rounded-xl"
      style={{ backgroundColor: item.usedBy ? colors.neutral[100] : 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], letterSpacing: 2 }}
            className="text-lg"
          >
            {item.code}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs mt-1">
            Created {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.usedBy && (
            <View className="flex-row items-center mt-1">
              <Check size={12} color={colors.success} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.success }} className="text-xs ml-1">
                Used {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : ''}
              </Text>
            </View>
          )}
        </View>

        {!item.usedBy && (
          <View className="flex-row items-center">
            <Pressable onPress={() => handleCopyCode(item.code)} className="p-2 mr-1">
              {copiedCode === item.code ? (
                <Check size={20} color={colors.success} />
              ) : (
                <Copy size={20} color={colors.neutral[500]} />
              )}
            </Pressable>
            <Pressable onPress={() => handleShareCode(item.code)} className="p-2 mr-1">
              <Share2 size={20} color={colors.primary[500]} />
            </Pressable>
            <Pressable onPress={() => handleDeleteCode(item.code)} className="p-2">
              <Trash2 size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.cream[100] }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 pb-4"
          style={{ paddingTop: insets.top + 16, backgroundColor: colors.primary[500] }}
        >
          <View className="flex-row items-center">
            <ShieldCheck size={24} color={colors.gold[400]} />
            <View style={{ marginLeft: 12 }}>
              <Text
                style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 15 }}
              >
                JELI - Keeper of the Legacy
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>
                Panel
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} className="p-2">
            <X size={24} color="white" />
          </Pressable>
        </View>

        {!isAuthenticated ? (
          <Animated.View entering={FadeIn.duration(400)} className="flex-1 justify-center px-6">
            <View
              className="p-6 rounded-2xl"
              style={{ backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
            >
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                  <Key size={32} color={colors.gold[600]} />
                </View>
              </View>

              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }} className="text-xl text-center mb-2">
              JELI - Keeper of the Legacy
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-sm text-center mb-6">
                Enter the admin password to manage access codes
              </Text>

              <View className="flex-row items-center px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.neutral[100] }}>
                <Key size={20} color={colors.neutral[400]} />
                <TextInput
                  value={password}
                  onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
                  placeholder="Admin Password"
                  placeholderTextColor={colors.neutral[400]}
                  secureTextEntry
                  autoCapitalize="characters"
                  style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[800], flex: 1, marginLeft: 12, fontSize: 16 }}
                />
              </View>

              {passwordError ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.error }} className="text-sm mb-4 text-center">
                  {passwordError}
                </Text>
              ) : null}

              <Pressable onPress={handleLogin} className="py-4 rounded-xl items-center" style={{ backgroundColor: colors.primary[500] }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-base">Login</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : adminView === 'dashboard' ? (
          /* ── DASHBOARD VIEW ── */
          <View className="flex-1 px-6 pt-6">
            {/* Stats */}
            <View className="flex-row mb-4">
              <View className="flex-1 p-4 rounded-xl mr-2" style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}>
                <View className="flex-row items-center">
                  <Key size={20} color={colors.primary[500]} />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-2xl ml-2">{unusedCodes.length}</Text>
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs mt-1">Available Codes</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl ml-2" style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}>
                <View className="flex-row items-center">
                  <Users size={20} color={colors.success} />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-2xl ml-2">{usedCodes.length}</Text>
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500] }} className="text-xs mt-1">Registered Users</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
              {/* Messages Card */}
              <Pressable
                onPress={() => { fetchUnreadCounts(); setAdminView('messages'); }}
                className="mb-4 p-4 rounded-2xl flex-row items-center"
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[100] }}>
                  <MessageCircle size={20} color={colors.primary[500]} />
                </View>
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>Messages</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12 }}>
                    {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'View Kalanden messages'}
                  </Text>
                </View>
                {totalUnread > 0 && (
                  <View style={{ backgroundColor: colors.primary[500], borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 12 }}>{totalUnread}</Text>
                  </View>
                )}
                <ChevronRight size={18} color={colors.neutral[400]} style={{ marginLeft: 8 }} />
              </Pressable>

              {/* Submissions Card */}
              <Pressable
                onPress={() => { fetchSubmissions(); setAdminView('submissions'); }}
                className="mb-4 p-4 rounded-2xl flex-row items-center"
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.gold[100] }}>
                  <Inbox size={20} color={colors.gold[600]} />
                </View>
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>Submissions</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12 }}>
                    View files, videos & reflections
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.neutral[400]} style={{ marginLeft: 8 }} />
              </Pressable>

              {/* Notation File Upload */}
              <Animated.View
                entering={FadeInDown.duration(400)}
                className="mb-4 p-4 rounded-2xl"
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.gold[100] }}>
                    <FileText size={16} color={colors.gold[600]} />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                    Notation File
                  </Text>
                </View>

                {uploadSuccess ? (
                  <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: '#10B981', marginLeft: 8, fontSize: 13 }}>
                      File uploaded successfully!
                    </Text>
                  </View>
                ) : notationPdfUrl ? (
                  <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: colors.gold[50] }}>
                    <CheckCircle size={16} color={colors.gold[600]} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], marginLeft: 8, fontSize: 12, flex: 1 }} numberOfLines={1}>
                      {notationPdfUrl.split('/').pop()}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginBottom: 10 }}>
                    No file uploaded yet — using Google Drive links.
                  </Text>
                )}

                <Pressable
                  onPress={handleUploadNotation}
                  disabled={isUploading}
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: isUploading ? colors.neutral[200] : colors.primary[500] }}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.neutral[500]} />
                  ) : (
                    <>
                      <Upload size={16} color="white" />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', marginLeft: 8, fontSize: 14 }}>
                        {notationPdfUrl ? 'Replace File' : 'Upload Notation File'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {/* Research Document Upload */}
              <Animated.View
                entering={FadeInDown.duration(400)}
                className="mb-4 p-4 rounded-2xl"
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary[100] }}>
                    <Globe size={16} color={colors.primary[500]} />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                    Cultural Research Document
                  </Text>
                </View>

                {researchUploadSuccess ? (
                  <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: '#10B981', marginLeft: 8, fontSize: 13 }}>
                      File uploaded successfully!
                    </Text>
                  </View>
                ) : researchDocUrl ? (
                  <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: colors.primary[50] ?? colors.primary[100] }}>
                    <CheckCircle size={16} color={colors.primary[500]} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], marginLeft: 8, fontSize: 12, flex: 1 }} numberOfLines={1}>
                      {researchDocUrl.split('/').pop()}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginBottom: 10 }}>
                    No file uploaded yet — using default link.
                  </Text>
                )}

                <Pressable
                  onPress={handleUploadResearch}
                  disabled={isUploadingResearch}
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: isUploadingResearch ? colors.neutral[200] : colors.primary[500] }}
                >
                  {isUploadingResearch ? (
                    <ActivityIndicator size="small" color={colors.neutral[500]} />
                  ) : (
                    <>
                      <Upload size={16} color="white" />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', marginLeft: 8, fontSize: 14 }}>
                        {researchDocUrl ? 'Replace Research File' : 'Upload Research File'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {/* Research Video ID */}
              <Animated.View
                entering={FadeInDown.duration(400)}
                className="mb-4 p-4 rounded-2xl"
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: colors.neutral[200] }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.gold[100] }}>
                    <Video size={16} color={colors.gold[600]} />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800] }} className="text-base">
                    Research Video (Vimeo ID)
                  </Text>
                </View>

                {researchVideoUrl && !videoIdInput ? (
                  <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: colors.gold[50] }}>
                    <CheckCircle size={16} color={colors.gold[600]} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], marginLeft: 8, fontSize: 12 }}>
                      Current ID: {researchVideoUrl}
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row items-center px-4 py-3 rounded-xl mb-3" style={{ backgroundColor: colors.neutral[100] }}>
                  <TextInput
                    value={videoIdInput}
                    onChangeText={setVideoIdInput}
                    placeholder={researchVideoUrl ?? 'Enter Vimeo video ID (e.g. 123456789)'}
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="numeric"
                    style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[800], flex: 1, fontSize: 14 }}
                  />
                </View>

                <Pressable
                  onPress={handleSaveVideoId}
                  disabled={!videoIdInput.trim()}
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: videoIdInput.trim() ? colors.gold[500] : colors.neutral[200] }}
                >
                  {videoIdSaved ? (
                    <>
                      <CheckCircle size={16} color="white" />
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', marginLeft: 8, fontSize: 14 }}>Saved!</Text>
                    </>
                  ) : (
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: videoIdInput.trim() ? 'white' : colors.neutral[400], fontSize: 14 }}>
                      Save Video ID
                    </Text>
                  )}
                </Pressable>
              </Animated.View>

              {/* Test Square Payment */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const config = logSquareConfig();
                  if (config.isConfigured) {
                    onClose();
                    router.push('/purchase');
                  } else {
                    Alert.alert('Square Not Configured', 'Add Square credentials in the ENV tab to enable payments.');
                  }
                }}
                className="flex-row items-center justify-center py-4 rounded-xl mb-3"
                style={{ backgroundColor: colors.success + '20', borderWidth: 1, borderColor: colors.success + '40' }}
              >
                <CreditCard size={20} color={colors.success} />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.success, marginLeft: 8, fontSize: 15 }}>
                  Test Square Payment
                </Text>
              </Pressable>

              {/* Generate Button */}
              <Pressable
                onPress={handleGenerateCode}
                className="flex-row items-center justify-center py-4 rounded-xl mb-4"
                style={{ backgroundColor: colors.primary[500] }}
              >
                <Plus size={22} color="white" />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white' }} className="text-base ml-2">
                  Generate New Code
                </Text>
              </Pressable>

              {/* Code List */}
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800] }} className="text-lg mb-3">
                Access Codes
              </Text>

              {codes.length === 0 ? (
                <View className="items-center py-10">
                  <Key size={48} color={colors.neutral[300]} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-base mt-4 text-center">
                    No codes yet.{'\n'}Tap the button above to generate one!
                  </Text>
                </View>
              ) : (
                [...unusedCodes, ...usedCodes].map(item => renderCodeItem(item))
              )}
            </ScrollView>
          </View>
        ) : adminView === 'messages' ? (
          /* ── MESSAGES LIST VIEW ── */
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
            {/* Back button header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Pressable onPress={() => setAdminView('dashboard')} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
                <ArrowLeft size={22} color={colors.neutral[800]} />
              </Pressable>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22 }}>Messages</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
              {participants.length === 0 ? (
                <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingVertical: 64 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <MessageCircle size={36} color={colors.neutral[300]} />
                  </View>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17, textAlign: 'center' }}>
                    No Kalandenw yet
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
                    Kalandenw will appear here once they join the program
                  </Text>
                </Animated.View>
              ) : (
                participants.map((participant, index) => {
                  const unread = unreadCounts[participant.code] ?? 0;
                  return (
                    <Animated.View key={participant.code} entering={FadeInUp.duration(400).delay(index * 80)}>
                      <Pressable
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedConvCode(participant.code);
                          setSelectedConvName(participant.userName ?? '');
                          setIsLoadingConv(true);
                          setAdminView('conversation');
                          await fetchConvMessages(participant.code);
                          setIsLoadingConv(false);
                          await markConvRead(participant.code);
                        }}
                        style={{
                          marginBottom: 12,
                          padding: 16,
                          borderRadius: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'white',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100] }}>
                          <User size={22} color={colors.primary[500]} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                              {participant.userName}
                            </Text>
                            {unread > 0 && (
                              <View style={{ backgroundColor: colors.primary[500], borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 11 }}>{unread}</Text>
                              </View>
                            )}
                          </View>
                          {participant.userEmail ? (
                            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                              {participant.userEmail}
                            </Text>
                          ) : null}
                          {unread > 0 && (
                            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginTop: 4 }}>
                              {unread} new message{unread > 1 ? 's' : ''}
                            </Text>
                          )}
                        </View>
                        <ChevronRight size={18} color={colors.neutral[400]} style={{ marginLeft: 8 }} />
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          </View>
        ) : adminView === 'submissions' ? (
          /* ── SUBMISSIONS VIEW ── */
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Pressable onPress={() => setAdminView('dashboard')} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
                <ArrowLeft size={22} color={colors.neutral[800]} />
              </Pressable>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 22 }}>Submissions</Text>
            </View>

            {isLoadingSubmissions ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                {submissions.length === 0 ? (
                  <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingVertical: 64 }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Inbox size={36} color={colors.neutral[300]} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17, textAlign: 'center' }}>
                      No submissions yet
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
                      Kalanden submissions will appear here
                    </Text>
                  </Animated.View>
                ) : (
                  submissions.map((sub, index) => {
                    const typeConfig = sub.type === 'video'
                      ? { icon: <Video size={18} color={colors.primary[500]} />, bg: colors.primary[100], label: 'Video' }
                      : sub.type === 'file'
                      ? { icon: <FileText size={18} color={colors.gold[600]} />, bg: colors.gold[100], label: 'File' }
                      : { icon: <PenLine size={18} color={colors.success} />, bg: '#ECFDF5', label: 'Reflection' };
                    return (
                      <Animated.View key={sub.id} entering={FadeInUp.duration(400).delay(index * 60)}>
                        <View
                          style={{
                            marginBottom: 14,
                            borderRadius: 16,
                            backgroundColor: 'white',
                            borderWidth: 1,
                            borderColor: colors.neutral[200],
                            overflow: 'hidden',
                          }}
                        >
                          {/* Header row */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color={colors.primary[500]} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 14 }}>
                                {sub.participantName}
                              </Text>
                              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 1 }}>
                                {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: typeConfig.bg }}>
                              {typeConfig.icon}
                              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700], fontSize: 12, marginLeft: 4 }}>{typeConfig.label}</Text>
                            </View>
                          </View>

                          {/* Assignment title */}
                          <View style={{ paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.neutral[100], paddingTop: 10 }}>
                            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], fontSize: 12, marginBottom: 4 }}>Assignment</Text>
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 14 }}>
                              {sub.assignmentTitle}
                            </Text>
                          </View>

                          {/* Content */}
                          {sub.reflection ? (
                            <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], fontSize: 13, lineHeight: 19 }}>
                                {sub.reflection}
                              </Text>
                            </View>
                          ) : sub.fileUrl ? (
                            <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                              <Pressable
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  Alert.alert('Open File', `${sub.fileName ?? 'View submission'}\n\n${sub.fileUrl}`, [
                                    { text: 'Copy Link', onPress: async () => { await Clipboard.setStringAsync(sub.fileUrl ?? ''); } },
                                    { text: 'Close', style: 'cancel' },
                                  ]);
                                }}
                                style={{
                                  flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10,
                                  backgroundColor: colors.primary[50] ?? colors.primary[100],
                                  borderWidth: 1, borderColor: colors.primary[100],
                                }}
                              >
                                {sub.type === 'video' ? <Video size={18} color={colors.primary[500]} /> : <FileText size={18} color={colors.primary[500]} />}
                                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                                  {sub.fileName ?? (sub.type === 'video' ? 'View video' : 'View file')}
                                </Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      </Animated.View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          /* ── CONVERSATION VIEW ── */
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
            {/* Conversation header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Pressable
                onPress={() => { setAdminView('messages'); fetchUnreadCounts(); }}
                style={{ padding: 8, marginLeft: -8, marginRight: 8 }}
              >
                <ArrowLeft size={22} color={colors.neutral[800]} />
              </Pressable>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100], marginRight: 10 }}>
                <User size={18} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                  {selectedConvName}
                </Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 12 }}>
                  Kalanden{' '}
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: colors.neutral[400], fontSize: 11 }}>— Carrier of Tradition</Text>
                </Text>
              </View>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                ref={convScrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingConv ? (
                  <View style={{ alignItems: 'center', paddingTop: 60 }}>
                    <ActivityIndicator color={colors.primary[500]} />
                  </View>
                ) : convMessages.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 60 }}>
                    <MessageCircle size={48} color={colors.neutral[300]} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 16, marginTop: 16 }}>
                      No messages yet
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                      Send a response to {selectedConvName}
                    </Text>
                  </View>
                ) : (
                  convMessages.map((msg, index) => {
                    const isFromMe = msg.senderId === 'admin';
                    const showDate =
                      index === 0 ||
                      formatDate(msg.timestamp) !== formatDate(convMessages[index - 1]!.timestamp);
                    return (
                      <View key={msg.id}>
                        {showDate && (
                          <Text
                            style={{
                              fontFamily: 'DMSans_500Medium',
                              color: colors.neutral[400],
                              fontSize: 12,
                              textAlign: 'center',
                              marginVertical: 16,
                            }}
                          >
                            {formatDate(msg.timestamp)}
                          </Text>
                        )}
                        <Animated.View
                          entering={FadeInUp.duration(300)}
                          style={{
                            marginBottom: 12,
                            maxWidth: '80%',
                            alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {!isFromMe && (
                            <Text
                              style={{
                                fontFamily: 'DMSans_500Medium',
                                color: colors.neutral[500],
                                fontSize: 11,
                                marginBottom: 3,
                              }}
                            >
                              {msg.senderName}
                            </Text>
                          )}
                          <View
                            style={{
                              paddingHorizontal: msg.mediaType ? 12 : 16,
                              paddingVertical: msg.mediaType ? 10 : 12,
                              borderRadius: 18,
                              backgroundColor: isFromMe ? colors.primary[500] : 'white',
                              borderBottomRightRadius: isFromMe ? 4 : 18,
                              borderBottomLeftRadius: isFromMe ? 18 : 4,
                            }}
                          >
                            {msg.mediaType === 'audio' && msg.mediaUrl
                              ? <AudioMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                              : msg.mediaType === 'video' && msg.mediaUrl
                              ? <VideoMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                              : <Text
                                  style={{
                                    fontFamily: 'DMSans_400Regular',
                                    color: isFromMe ? 'white' : colors.neutral[800],
                                    fontSize: 14,
                                    lineHeight: 20,
                                  }}
                                >
                                  {msg.text}
                                </Text>
                            }
                          </View>
                          <Text
                            style={{
                              fontFamily: 'DMSans_400Regular',
                              color: colors.neutral[400],
                              fontSize: 11,
                              marginTop: 3,
                              textAlign: isFromMe ? 'right' : 'left',
                            }}
                          >
                            {formatTime(msg.timestamp)}
                          </Text>
                        </Animated.View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Input bar */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  paddingTop: 8,
                  paddingBottom: insets.bottom + 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.neutral[200],
                }}
              >
                <VoiceNoteRecorder onSend={handleSendConvMedia} isFromMe={true} />
                <TextInput
                  value={convNewMessage}
                  onChangeText={setConvNewMessage}
                  placeholder="Type your response..."
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    color: colors.neutral[800],
                    backgroundColor: colors.neutral[100],
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: 10,
                    flex: 1,
                    maxHeight: 100,
                    fontSize: 15,
                  }}
                />
                <Pressable
                  onPress={handleSendConvVideo}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] }}
                >
                  <Video size={20} color={colors.neutral[600]} />
                </Pressable>
                <Pressable
                  onPress={handleSendConvMessage}
                  disabled={!convNewMessage.trim() || isSendingConv}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: convNewMessage.trim() ? colors.primary[500] : colors.neutral[200],
                  }}
                >
                  {isSendingConv ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Send size={20} color={convNewMessage.trim() ? 'white' : colors.neutral[400]} />
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </Modal>
  );
}
