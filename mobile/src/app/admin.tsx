import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Lock, Plus, Trash2, Copy, Check, ArrowLeft, FileText,
  Upload, CheckCircle, MessageCircle, Send, User, ChevronRight,
  ShieldCheck, Key, Users, Share2, Video, Inbox, ExternalLink,
  BarChart2, Clock, BookOpen, Play,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { useResourcesStore } from '@/lib/resourcesStore';
import { uploadFile } from '@/lib/upload';
import { colors } from '@/lib/theme';
import { mockModules } from '@/lib/mockData';
import { NotificationToast, type ToastData } from '@/components/NotificationToast';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { AudioMessage } from '@/components/AudioMessage';
import { VideoMessage } from '@/components/VideoMessage';
import DiscussionForum from '@/components/DiscussionForum';
import * as ImagePicker from 'expo-image-picker';

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

type AdminView = 'dashboard' | 'messages' | 'conversation' | 'submissions' | 'participants' | 'participant-detail' | 'discussions';

interface ParticipantProgress {
  code: string;
  name: string;
  email: string;
  completedLessons: string[];
  lessonStudyTime: Record<string, number>;
  lastSyncedAt: string;
}

interface FeedbackEntry {
  id: string;
  participantCode: string;
  moduleId?: string;
  message: string;
  instructorName: string;
  createdAt: string;
  readByParticipant: boolean;
}

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

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // View state
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');

  // Messaging state
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [convMessages, setConvMessages] = useState<BackendMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Notification toast
  const [toast, setToast] = useState<ToastData | null>(null);
  const prevUnreadTotalRef = useRef(-1); // -1 = not yet loaded

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Participants progress state
  const [progressList, setProgressList] = useState<ParticipantProgress[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProgress | null>(null);
  const [participantFeedback, setParticipantFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackModuleId, setFeedbackModuleId] = useState<string | undefined>(undefined);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [selectedDiscussionLesson, setSelectedDiscussionLesson] = useState<{ moduleId: string; moduleTitle: string; lessonIndex: number; lessonTitle: string } | null>(null);

  const { codes, loadCodes, generateCode, deleteCode, isAdmin, setAdmin } = useAccessCodeStore();
  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  const historyPdfUrl = useResourcesStore(s => s.historyPdfUrl);
  const setHistoryPdfUrl = useResourcesStore(s => s.setHistoryPdfUrl);
  const loadResources = useResourcesStore(s => s.loadResources);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
      loadCodes();
      fetchUnreadCounts();
      fetchProgress();
    }
    loadNotationPdfUrl();
    loadResources();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || adminView !== 'messages') return;
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminView]);

  useEffect(() => {
    if (!isAuthenticated || adminView !== 'conversation' || !selectedCode) return;
    const interval = setInterval(() => fetchConvMessages(selectedCode), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminView, selectedCode]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/unread-counts`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json() as { counts: Record<string, number> };
        const newCounts = data.counts;
        const newTotal = Object.values(newCounts).reduce((s, n) => s + n, 0);

        // Notify instructor when new participant messages arrive (skip first load)
        if (prevUnreadTotalRef.current >= 0 && newTotal > prevUnreadTotalRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setToast({
            id: `admin-unread-${Date.now()}`,
            title: 'New Message from Kalanden',
            body: `You have ${newTotal} unread message${newTotal > 1 ? 's' : ''}`,
          });
        }
        prevUnreadTotalRef.current = newTotal;
        setUnreadCounts(newCounts);
      }
    } catch {}
  }, []);

  const fetchConvMessages = useCallback(async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${code}`);
      if (res.ok) {
        const data = await res.json() as { messages: BackendMessage[] };
        setConvMessages(data.messages);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
  }, []);

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions`);
      if (res.ok) {
        const data = await res.json() as { submissions: Submission[] };
        setSubmissions(data.submissions.reverse());
      }
    } catch {}
    finally {
      setIsLoadingSubmissions(false);
    }
  };

  const markRead = async (code: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/messages/${code}/read`, {
        method: 'POST',
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      setUnreadCounts(prev => ({ ...prev, [code]: 0 }));
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${selectedCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: 'admin', senderName: 'BaKari Lindsay', text: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json() as { message: BackendMessage };
        setConvMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {} finally {
      setIsSending(false);
    }
  };

  const fetchProgress = async () => {
    setIsLoadingProgress(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/progress/all`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json() as { participants: ParticipantProgress[] };
        setProgressList(data.participants);
      }
    } catch {} finally {
      setIsLoadingProgress(false);
    }
  };

  const fetchParticipantFeedback = async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/progress/feedback/${code}`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json() as { feedback: FeedbackEntry[] };
        setParticipantFeedback(data.feedback);
      }
    } catch {}
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !selectedParticipant) return;
    setIsSendingFeedback(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/progress/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
        body: JSON.stringify({
          participantCode: selectedParticipant.code,
          moduleId: feedbackModuleId,
          message: feedbackText.trim(),
          instructorName: 'BaKari Lindsay',
        }),
      });
      if (res.ok) {
        const data = await res.json() as { feedback: FeedbackEntry };
        setParticipantFeedback(prev => [data.feedback, ...prev]);
        setFeedbackText('');
        setFeedbackModuleId(undefined);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {} finally {
      setIsSendingFeedback(false);
    }
  };

  const handleLogin = () => {
    if (password.toUpperCase() === ADMIN_PASSWORD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
      setPasswordError('');
      setAdmin(true);
      loadCodes();
      fetchUnreadCounts();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleGenerateCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const code = await generateCode();
    await Clipboard.setStringAsync(code);
    Alert.alert('Code Generated', `New code: ${code}\n\nCopied to clipboard!`);
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
    } catch {}
  };

  const handleDeleteCode = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Code', `Are you sure you want to delete ${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCode(code) },
    ]);
  };

  const handleUploadNotation = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0]!;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
      await setNotationPdfUrl(uploaded.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `"${asset.name}" uploaded successfully.`);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploadingHistory, setIsUploadingHistory] = useState(false);
  const handleUploadHistoryPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0]!;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploadingHistory(true);
    try {
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
      await setHistoryPdfUrl(uploaded.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `"${asset.name}" uploaded successfully.`);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploadingHistory(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);
  const participants = codes.filter(c => c.userName);
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  if (!fontsLoaded) return null;

  // ── Password screen ──
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 20,
          paddingHorizontal: 24,
          backgroundColor: colors.primary[500],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <ShieldCheck size={22} color={colors.gold[400]} />
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 22, marginLeft: 8 }}>
              Admin Panel
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <Animated.View entering={FadeIn.duration(500)}>
            <View style={{ alignItems: 'center', marginBottom: 36 }}>
              <View style={{
                width: 88, height: 88,
                borderRadius: 44,
                backgroundColor: colors.gold[100],
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                shadowColor: colors.gold[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}>
                <Lock size={40} color={colors.gold[600]} />
              </View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 28, marginBottom: 8 }}>
                Admin Access
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                Enter your password to manage the AFeeree program
              </Text>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
                Password
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.neutral[50],
                  borderWidth: 1.5,
                  borderColor: passwordError ? colors.error : colors.neutral[200],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[800],
                  fontSize: 16,
                  marginBottom: passwordError ? 8 : 20,
                }}
                placeholder="Enter password..."
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry
                autoCapitalize="characters"
                value={password}
                onChangeText={t => { setPassword(t); setPasswordError(''); }}
                onSubmitEditing={handleLogin}
              />
              {passwordError ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.error, fontSize: 13, marginBottom: 16 }}>
                  {passwordError}
                </Text>
              ) : null}

              <Pressable
                onPress={handleLogin}
                style={{
                  backgroundColor: password.trim() ? colors.primary[500] : colors.neutral[200],
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: password.trim() ? 'white' : colors.neutral[400], fontSize: 16 }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Messages list ──
  if (adminView === 'messages') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 20,
          paddingHorizontal: 24,
          backgroundColor: colors.primary[500],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => { setAdminView('dashboard'); fetchUnreadCounts(); }} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 24 }}>Messages</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 1 }}>
                Kalanden conversations
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                One who studies, absorbs, and prepares to carry forward tradition
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {participants.length === 0 ? (
            <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <User size={40} color={colors.neutral[300]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17 }}>No Kalandenw yet</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 6, textAlign: 'center' }}>
                Kalandenw will appear once they join
              </Text>
            </Animated.View>
          ) : (
            participants.map((p, i) => {
              const unread = unreadCounts[p.code] ?? 0;
              return (
                <Animated.View key={p.code} entering={FadeInDown.duration(400).delay(i * 80)}>
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCode(p.code);
                      setSelectedName(p.userName ?? 'Kalanden');
                      setIsLoadingMessages(true);
                      setAdminView('conversation');
                      await fetchConvMessages(p.code);
                      setIsLoadingMessages(false);
                      await markRead(p.code);
                    }}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                      borderWidth: unread > 0 ? 1.5 : 0,
                      borderColor: unread > 0 ? colors.gold[400] : 'transparent',
                    }}
                  >
                    <View style={{
                      width: 50, height: 50, borderRadius: 25,
                      backgroundColor: unread > 0 ? colors.gold[100] : colors.primary[100],
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={24} color={unread > 0 ? colors.gold[600] : colors.primary[500]} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                          {p.userName}
                        </Text>
                        {unread > 0 && (
                          <View style={{ backgroundColor: colors.gold[500], borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 12 }}>{unread}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 3 }}>
                        {p.userEmail}
                      </Text>
                      {unread > 0 && (
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.gold[600], fontSize: 13, marginTop: 4 }}>
                          {unread} new message{unread > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={colors.neutral[300]} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Participants List ──
  if (adminView === 'discussions') {
    const historyModule = mockModules.find((m) => m.isHistoryModule);

    if (selectedDiscussionLesson) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
          <View style={{ paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.neutral[200] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setSelectedDiscussionLesson(null)} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
                <ArrowLeft size={24} color={colors.neutral[800]} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>{selectedDiscussionLesson.lessonTitle}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 2 }} numberOfLines={1}>{selectedDiscussionLesson.moduleTitle}</Text>
              </View>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <DiscussionForum
              moduleId={selectedDiscussionLesson.moduleId}
              lessonIndex={selectedDiscussionLesson.lessonIndex}
              participantCode="admin"
              participantName="Jeli"
              isAdmin={true}
            />
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: colors.primary[500] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => setAdminView('dashboard')} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 22 }}>Discussion Forums</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
                History & Context — select a lesson
              </Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {!historyModule ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <MessageCircle size={32} color={colors.neutral[300]} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                No discussion module found.
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 }}>
                {historyModule.title}
              </Text>
              {Array.from({ length: historyModule.lessons }, (_, i) => {
                const title = historyModule.lessonPages?.[i]?.title ?? `Lesson ${i + 1}`;
                const pageRange = historyModule.lessonPages?.[i]
                  ? `pp. ${historyModule.lessonPages[i].startPage}–${historyModule.lessonPages[i].endPage}`
                  : null;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedDiscussionLesson({ moduleId: historyModule.id, moduleTitle: historyModule.title, lessonIndex: i, lessonTitle: title })}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.neutral[200], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <MessageCircle size={18} color={colors.primary[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>{title}</Text>
                      {pageRange && <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginTop: 2 }}>{pageRange}</Text>}
                    </View>
                    <ChevronRight size={18} color={colors.neutral[300]} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (adminView === 'participants') {
    const totalModuleLessons = mockModules.reduce((s, m) => s + m.lessons, 0);
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: colors.primary[500] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => setAdminView('dashboard')} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 24 }}>Kalanden Progress</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                One who studies, absorbs, and prepares to carry forward tradition
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                {progressList.length} Kalanden{progressList.length !== 1 ? 'w' : ''} tracked
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {isLoadingProgress ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : progressList.length === 0 ? (
            <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <BarChart2 size={40} color={colors.neutral[300]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17 }}>No progress synced yet</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                Progress will appear here once Kalandenw complete their first lesson
              </Text>
            </Animated.View>
          ) : (
            progressList.map((p, i) => {
              const notationMs = Object.entries(p.lessonStudyTime)
                .filter(([k]) => !k.endsWith('-video'))
                .reduce((s, [, v]) => s + v, 0);
              const videoMs = Object.entries(p.lessonStudyTime)
                .filter(([k]) => k.endsWith('-video'))
                .reduce((s, [, v]) => s + v, 0);
              const notationHours = (notationMs / 3600000).toFixed(1);
              const videoHours = (videoMs / 3600000).toFixed(1);
              const completedCount = p.completedLessons.length;
              const pct = Math.round((completedCount / totalModuleLessons) * 100);
              return (
                <Animated.View key={p.code} entering={FadeInDown.duration(400).delay(i * 60)}>
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedParticipant(p);
                      setFeedbackText('');
                      setFeedbackModuleId(undefined);
                      await fetchParticipantFeedback(p.code);
                      setAdminView('participant-detail');
                    }}
                    style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[600], fontSize: 16 }}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>{p.name}</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12 }}>{p.email || p.code}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.neutral[300]} />
                    </View>
                    {/* Lesson progress bar */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.neutral[100], overflow: 'hidden', marginRight: 10 }}>
                        <View style={{ height: '100%', borderRadius: 3, backgroundColor: pct === 100 ? colors.success : colors.primary[400], width: `${pct}%` }} />
                      </View>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 12 }}>{pct}%</Text>
                    </View>
                    {/* Study time breakdown: notation vs video */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gold[50], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                        <FileText size={12} color={colors.gold[600]} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[700], fontSize: 13 }}>{notationHours}h</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600], fontSize: 10 }}>Notation</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}>
                        <Play size={12} color="#6366F1" />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#4F46E5', fontSize: 13 }}>{videoHours}h</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: '#6366F1', fontSize: 10 }}>Video</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[50], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}>
                        <BookOpen size={12} color={colors.neutral[500]} />
                        <View style={{ marginLeft: 6 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 13 }}>{completedCount}</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 10 }}>Lessons</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Participant Detail ──
  if (adminView === 'participant-detail' && selectedParticipant) {
    const p = selectedParticipant;
    const MODULE_REQUIRED_MS = 240 * 60 * 1000;
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: colors.primary[500] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => setAdminView('participants')} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 22 }}>{p.name}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{p.email || p.code}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Module Progress */}
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
            Module Progress
          </Text>
          {mockModules.map((mod, i) => {
            const completed = p.completedLessons.filter(l => l.startsWith(`${mod.id}-`)).length;
            const pct = Math.round((completed / mod.lessons) * 100);
            // Notation time: lesson sessions only (excludes -video key)
            const notationMs = Object.entries(p.lessonStudyTime)
              .filter(([k]) => k.startsWith(`${mod.id}-`) && !k.endsWith('-video'))
              .reduce((s, [, v]) => s + v, 0);
            // Video time: only the -video key
            const videoMs = p.lessonStudyTime[`${mod.id}-video`] ?? 0;
            const totalMs = notationMs + videoMs;
            const notationPct = Math.min(notationMs / MODULE_REQUIRED_MS * 100, 100);
            const videoPct = Math.min(videoMs / MODULE_REQUIRED_MS * 100, 100);
            const totalHours = (totalMs / 3600000).toFixed(1);
            const notationHours = (notationMs / 3600000).toFixed(1);
            const videoHours = (videoMs / 3600000).toFixed(1);
            return (
              <Animated.View key={mod.id} entering={FadeInDown.duration(300).delay(i * 40)}>
                <Pressable
                  onPress={() => setFeedbackModuleId(prev => prev === mod.id ? undefined : mod.id)}
                  style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 14 }} numberOfLines={1}>{mod.title}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginTop: 2 }}>
                        {completed}/{mod.lessons} lessons · {totalHours}h / 4h total
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: pct === 100 ? colors.success : colors.neutral[600] }}>{pct}%</Text>
                    </View>
                  </View>

                  {/* Lesson completion bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <BookOpen size={10} color={colors.neutral[400]} style={{ marginRight: 5 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, width: 56 }}>Lessons</Text>
                    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[100], overflow: 'hidden', marginRight: 6 }}>
                      <View style={{ height: '100%', borderRadius: 2, backgroundColor: pct === 100 ? colors.success : colors.primary[400], width: `${pct}%` }} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 10, width: 36, textAlign: 'right' }}>{completed}/{mod.lessons}</Text>
                  </View>

                  {/* Notation study bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <FileText size={10} color={colors.neutral[400]} style={{ marginRight: 5 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, width: 56 }}>Notation</Text>
                    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[100], overflow: 'hidden', marginRight: 6 }}>
                      <View style={{ height: '100%', borderRadius: 2, backgroundColor: notationPct >= 100 ? colors.success : colors.gold[400], width: `${notationPct}%` }} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 10, width: 36, textAlign: 'right' }}>{notationHours}h</Text>
                  </View>

                  {/* Video watch bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Play size={10} color={colors.neutral[400]} style={{ marginRight: 5 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, width: 56 }}>Video</Text>
                    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[100], overflow: 'hidden', marginRight: 6 }}>
                      <View style={{ height: '100%', borderRadius: 2, backgroundColor: videoPct >= 100 ? colors.success : '#6366F1', width: `${videoPct}%` }} />
                    </View>
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 10, width: 36, textAlign: 'right' }}>{videoHours}h</Text>
                  </View>

                  {feedbackModuleId === mod.id && (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.neutral[100] }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 12 }}>
                        Feedback will be tagged to this module
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Feedback Section */}
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8, marginBottom: 2 }}>
            Jeli Feedback
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginBottom: 12 }}>
            A respected transmitter of history, culture, and embodied wisdom
          </Text>

          {/* Compose feedback */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            {feedbackModuleId && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[50], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 }}>
                <BookOpen size={12} color={colors.primary[500]} />
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[600], fontSize: 12, marginLeft: 6, flex: 1 }}>
                  {mockModules.find(m => m.id === feedbackModuleId)?.title}
                </Text>
                <Pressable onPress={() => setFeedbackModuleId(undefined)}>
                  <Text style={{ color: colors.neutral[400], fontSize: 14 }}>×</Text>
                </Pressable>
              </View>
            )}
            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder={`Write feedback for ${p.name}...`}
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[800], fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }}
            />
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginBottom: 10 }}>
              Tap a module above to attach feedback to a specific module
            </Text>
            <Pressable
              onPress={handleSendFeedback}
              disabled={!feedbackText.trim() || isSendingFeedback}
              style={{ backgroundColor: feedbackText.trim() ? colors.primary[500] : colors.neutral[200], borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            >
              {isSendingFeedback
                ? <ActivityIndicator size="small" color="white" />
                : <>
                    <Send size={15} color={feedbackText.trim() ? 'white' : colors.neutral[400]} />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: feedbackText.trim() ? 'white' : colors.neutral[400], fontSize: 15, marginLeft: 8 }}>
                      Send Feedback
                    </Text>
                  </>
              }
            </Pressable>
          </View>

          {/* Past feedback */}
          {participantFeedback.length > 0 && (
            <>
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 12, marginBottom: 10 }}>
                Previous feedback ({participantFeedback.length})
              </Text>
              {participantFeedback.map((fb, i) => {
                const mod = fb.moduleId ? mockModules.find(m => m.id === fb.moduleId) : null;
                return (
                  <Animated.View key={fb.id} entering={FadeInDown.duration(300).delay(i * 50)}>
                    <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: fb.readByParticipant ? colors.neutral[200] : colors.primary[400] }}>
                      {mod && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <BookOpen size={11} color={colors.primary[400]} />
                          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 11, marginLeft: 4 }}>{mod.title}</Text>
                        </View>
                      )}
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, lineHeight: 20 }}>{fb.message}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11 }}>
                          {formatDate(fb.createdAt)} · {formatTime(fb.createdAt)}
                        </Text>
                        {!fb.readByParticipant && (
                          <View style={{ marginLeft: 8, backgroundColor: colors.primary[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 10 }}>Unread</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Submissions ──
  if (adminView === 'submissions') {
    const typeBadge = (type: Submission['type']) => {
      if (type === 'video') return { label: 'Video', bg: colors.primary[100], color: colors.primary[500] };
      if (type === 'file') return { label: 'File', bg: colors.gold[100], color: colors.gold[600] };
      return { label: 'Reflection', bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
    };

    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 20,
          paddingHorizontal: 24,
          backgroundColor: colors.primary[500],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => setAdminView('dashboard')} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 24 }}>Submissions</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 1 }}>
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {isLoadingSubmissions ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <ActivityIndicator color={colors.primary[500]} size="large" />
            </View>
          ) : submissions.length === 0 ? (
            <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Inbox size={40} color={colors.neutral[300]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17 }}>No submissions yet</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 }}>
                Kalanden submissions will appear here once they complete assignments
              </Text>
            </Animated.View>
          ) : (
            submissions.map((sub, i) => {
              const badge = typeBadge(sub.type);
              return (
                <Animated.View key={sub.id} entering={FadeInDown.duration(400).delay(i * 60)}>
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>
                          {sub.participantName}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 2 }}>
                          {sub.assignmentTitle}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: badge.bg, marginLeft: 8 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: badge.color, fontSize: 11 }}>{badge.label}</Text>
                      </View>
                    </View>

                    {/* Reflection text */}
                    {sub.reflection ? (
                      <View style={{ backgroundColor: colors.neutral[50], borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, lineHeight: 20 }}>
                          {sub.reflection}
                        </Text>
                      </View>
                    ) : null}

                    {/* File/Video link */}
                    {sub.fileUrl ? (
                      <Pressable
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          await WebBrowser.openBrowserAsync(sub.fileUrl!);
                        }}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          backgroundColor: colors.primary[50] ?? colors.primary[100],
                          borderRadius: 10, padding: 12,
                        }}
                      >
                        <ExternalLink size={16} color={colors.primary[500]} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                          {sub.fileName ?? 'View submitted file'}
                        </Text>
                        <Copy size={14} color={colors.primary[400]} />
                      </Pressable>
                    ) : null}
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Conversation ──
  if (adminView === 'conversation') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
        <View style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: colors.primary[500],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => { setAdminView('messages'); fetchUnreadCounts(); }} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <User size={20} color="white" />
            </View>
            <View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 17 }}>{selectedName}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Kalanden</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
            {isLoadingMessages ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : convMessages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <MessageCircle size={48} color={colors.neutral[300]} />
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 16, marginTop: 16 }}>No messages yet</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 4 }}>
                  Send a message to {selectedName}
                </Text>
              </View>
            ) : (
              convMessages.map((msg, index) => {
                const isFromMe = msg.senderId === 'admin';
                const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(convMessages[index - 1]!.timestamp);
                return (
                  <View key={msg.id}>
                    {showDate && (
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400], fontSize: 12, textAlign: 'center', marginVertical: 14 }}>
                        {formatDate(msg.timestamp)}
                      </Text>
                    )}
                    <View style={{ marginBottom: 10, maxWidth: '80%', alignSelf: isFromMe ? 'flex-end' : 'flex-start' }}>
                      {!isFromMe && (
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 11, marginBottom: 3 }}>
                          {msg.senderName}
                        </Text>
                      )}
                      <View style={{
                        paddingHorizontal: msg.mediaType ? 12 : 16, paddingVertical: msg.mediaType ? 10 : 11, borderRadius: 18,
                        backgroundColor: isFromMe ? colors.primary[500] : 'white',
                        borderBottomRightRadius: isFromMe ? 4 : 18,
                        borderBottomLeftRadius: isFromMe ? 18 : 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isFromMe ? 0 : 0.05,
                        shadowRadius: 4,
                      }}>
                        {msg.mediaType === 'audio' && msg.mediaUrl
                          ? <AudioMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                          : msg.mediaType === 'video' && msg.mediaUrl
                          ? <VideoMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                          : <Text style={{ fontFamily: 'DMSans_400Regular', color: isFromMe ? 'white' : colors.neutral[800], fontSize: 15, lineHeight: 21 }}>{msg.text}</Text>
                        }
                      </View>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginTop: 3, textAlign: isFromMe ? 'right' : 'left' }}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', gap: 8,
            paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 8,
            backgroundColor: 'white',
            borderTopWidth: 1, borderTopColor: colors.neutral[100],
          }}>
            <VoiceNoteRecorder
              onSend={async (url, type) => {
                if (!selectedCode) return;
                const res = await fetch(`${BACKEND_URL}/api/messages/${selectedCode}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ senderId: 'admin', senderName: 'BaKari Lindsay', text: '', mediaUrl: url, mediaType: type }),
                });
                if (res.ok) {
                  const data = await res.json() as { message: BackendMessage };
                  setConvMessages(prev => [...prev, data.message]);
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                }
              }}
              isFromMe={true}
            />
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your response..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              style={{
                flex: 1,
                backgroundColor: colors.neutral[100],
                borderRadius: 22,
                paddingHorizontal: 18,
                paddingTop: 11,
                paddingBottom: 11,
                maxHeight: 100,
                fontFamily: 'DMSans_400Regular',
                color: colors.neutral[800],
                fontSize: 15,
              }}
            />
            <Pressable
              onPress={async () => {
                if (!selectedCode) return;
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 60, quality: 0.7 });
                if (result.canceled || !result.assets[0]) return;
                try {
                  const uploaded = await uploadFile(result.assets[0].uri, `video-${Date.now()}.mp4`, 'video/mp4');
                  const res = await fetch(`${BACKEND_URL}/api/messages/${selectedCode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senderId: 'admin', senderName: 'BaKari Lindsay', text: '', mediaUrl: uploaded.url, mediaType: 'video' }),
                  });
                  if (res.ok) {
                    const data = await res.json() as { message: BackendMessage };
                    setConvMessages(prev => [...prev, data.message]);
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                  }
                } catch {}
              }}
              style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] }}
            >
              <Video size={20} color={colors.neutral[600]} />
            </Pressable>
            <Pressable
              onPress={handleSend}
              disabled={!newMessage.trim() || isSending}
              style={{
                width: 46, height: 46, borderRadius: 23,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: newMessage.trim() ? colors.primary[500] : colors.neutral[200],
              }}
            >
              {isSending
                ? <ActivityIndicator size="small" color="white" />
                : <Send size={20} color={newMessage.trim() ? 'white' : colors.neutral[400]} />
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Dashboard ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingBottom: 20,
        paddingHorizontal: 24,
        backgroundColor: colors.primary[500],
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <ShieldCheck size={22} color={colors.gold[400]} />
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 24, marginLeft: 8 }}>
              Admin Panel
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Key size={18} color={colors.primary[500]} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 28, marginLeft: 8 }}>{unusedCodes.length}</Text>
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>Available Codes</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Users size={18} color={colors.success} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 28, marginLeft: 8 }}>{usedCodes.length}</Text>
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13 }}>Enrolled Users</Text>
          </View>
        </Animated.View>

        {/* Study Time Overview */}
        {progressList.length > 0 && (() => {
          const totalNotationMs = progressList.reduce((sum, p) =>
            sum + Object.entries(p.lessonStudyTime).filter(([k]) => !k.endsWith('-video')).reduce((s, [, v]) => s + v, 0), 0);
          const totalVideoMs = progressList.reduce((sum, p) =>
            sum + Object.entries(p.lessonStudyTime).filter(([k]) => k.endsWith('-video')).reduce((s, [, v]) => s + v, 0), 0);
          const notationHrs = (totalNotationMs / 3600000).toFixed(1);
          const videoHrs = (totalVideoMs / 3600000).toFixed(1);
          return (
            <Animated.View entering={FadeInDown.duration(400).delay(40)} style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[500], fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 }}>Study Time — All Kalandenw</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, fontStyle: 'italic', marginBottom: 12 }}>
                One who studies, absorbs, and prepares to carry forward tradition
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: colors.gold[50], borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <FileText size={18} color={colors.gold[600]} />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[700], fontSize: 22, marginTop: 6 }}>{notationHrs}h</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.gold[600], fontSize: 12, marginTop: 2 }}>Notation Study</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <Play size={18} color="#6366F1" />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#4F46E5', fontSize: 22, marginTop: 6 }}>{videoHrs}h</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: '#6366F1', fontSize: 12, marginTop: 2 }}>Video Watch</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.neutral[50], borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <Users size={18} color={colors.neutral[500]} />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 22, marginTop: 6 }}>{progressList.length}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 2 }}>Kalandenw</Text>
                </View>
              </View>
            </Animated.View>
          );
        })()}

        {/* Messages Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchUnreadCounts(); setAdminView('messages'); }}
            style={{
              backgroundColor: totalUnread > 0 ? colors.primary[500] : 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: totalUnread > 0 ? 'rgba(255,255,255,0.2)' : colors.primary[100],
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageCircle size={24} color={totalUnread > 0 ? 'white' : colors.primary[500]} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: totalUnread > 0 ? 'white' : colors.neutral[800], fontSize: 16 }}>
                Messages
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: totalUnread > 0 ? 'rgba(255,255,255,0.8)' : colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'View Kalanden messages'}
              </Text>
            </View>
            {totalUnread > 0 && (
              <View style={{ backgroundColor: colors.gold[400], borderRadius: 14, minWidth: 28, height: 28, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 14 }}>{totalUnread}</Text>
              </View>
            )}
            <ChevronRight size={20} color={totalUnread > 0 ? 'rgba(255,255,255,0.6)' : colors.neutral[300]} />
          </Pressable>
        </Animated.View>

        {/* Submissions Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(90)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchSubmissions(); setAdminView('submissions'); }}
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold[100], alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={24} color={colors.gold[600]} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Submissions</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>View files, videos & reflections</Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[300]} />
          </Pressable>
        </Animated.View>

        {/* Participant Progress Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(110)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchProgress(); setAdminView('participants'); }}
            style={{ backgroundColor: colors.primary[500], borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={24} color="white" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16 }}>Kalanden Progress</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                One who studies, absorbs, and prepares to carry forward tradition
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
                Track modules, time & offer feedback
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </Animated.View>

        {/* Discussion Forum Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(115)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAdminView('discussions'); }}
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary[200] }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} color={colors.primary[500]} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Discussion Forums</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                View & reply to Kalanden questions
              </Text>
            </View>
            <ChevronRight size={20} color={colors.neutral[300]} />
          </Pressable>
        </Animated.View>

        {/* Notation File Upload */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold[100], alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <FileText size={18} color={colors.gold[600]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Notation File</Text>
            </View>

            {notationPdfUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], fontSize: 12, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                  {notationPdfUrl.split('/').pop()}
                </Text>
              </View>
            ) : (
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 13, marginBottom: 14 }}>
                No file uploaded yet.
              </Text>
            )}

            <Pressable
              onPress={handleUploadNotation}
              disabled={isUploading}
              style={{
                backgroundColor: isUploading ? colors.neutral[200] : colors.primary[500],
                paddingVertical: 13,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
          </View>
        </Animated.View>

        {/* History Readings Upload */}
        <Animated.View entering={FadeInDown.duration(400).delay(130)}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <BookOpen size={18} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>History Readings</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12 }}>History and Context of AFeeree</Text>
              </View>
            </View>

            {historyPdfUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], fontSize: 12, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                  {historyPdfUrl.split('/').pop()}
                </Text>
              </View>
            ) : (
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 13, marginBottom: 14 }}>
                No readings file uploaded yet.
              </Text>
            )}

            <Pressable
              onPress={handleUploadHistoryPdf}
              disabled={isUploadingHistory}
              style={{
                backgroundColor: isUploadingHistory ? colors.neutral[200] : '#6366F1',
                paddingVertical: 13,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isUploadingHistory ? (
                <ActivityIndicator size="small" color={colors.neutral[500]} />
              ) : (
                <>
                  <Upload size={16} color="white" />
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', marginLeft: 8, fontSize: 14 }}>
                    {historyPdfUrl ? 'Replace Readings File' : 'Upload Readings File'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Participant Agreement Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(105)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/agreement'); }}
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold[100], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <FileText size={22} color={colors.gold[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Kalanden Agreement</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>One who studies, absorbs, and prepares to carry forward tradition</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 4 }}>View the Kalanden consent form</Text>
            </View>
            <ChevronRight size={18} color={colors.neutral[400]} />
          </Pressable>
        </Animated.View>

        {/* Generate Code Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <Pressable
            onPress={handleGenerateCode}
            style={{
              backgroundColor: colors.gold[500],
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: colors.gold[500],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Plus size={22} color="white" />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 16, marginLeft: 8 }}>
              Generate New Code
            </Text>
          </Pressable>
        </Animated.View>

        {/* Available Codes */}
        {unusedCodes.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(240)}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Available Codes
            </Text>
            {unusedCodes.map(item => (
              <View
                key={item.code}
                style={{
                  backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10,
                  flexDirection: 'row', alignItems: 'center',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.primary[500], fontSize: 18, letterSpacing: 2 }}>{item.code}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginTop: 2 }}>
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => handleCopyCode(item.code)} style={{ backgroundColor: colors.neutral[100], padding: 10, borderRadius: 10 }}>
                    {copiedCode === item.code ? <Check size={18} color={colors.success} /> : <Copy size={18} color={colors.neutral[600]} />}
                  </Pressable>
                  <Pressable onPress={() => handleShareCode(item.code)} style={{ backgroundColor: colors.primary[100], padding: 10, borderRadius: 10 }}>
                    <Share2 size={18} color={colors.primary[500]} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteCode(item.code)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 10 }}>
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4, marginTop: 8 }}>
              Enrolled Kalandenw
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginBottom: 12 }}>
              One who studies, absorbs, and prepares to carry forward tradition
            </Text>
            {usedCodes.map(item => (
              <View
                key={item.code}
                style={{
                  backgroundColor: colors.neutral[50], borderRadius: 14, padding: 16, marginBottom: 10,
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1, borderColor: colors.neutral[100],
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <User size={20} color={colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 15 }}>
                    {item.userName ?? item.usedBy}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginTop: 2 }}>
                    {item.code} · Joined {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : ''}
                  </Text>
                </View>
                <CheckCircle size={18} color={colors.success} />
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
