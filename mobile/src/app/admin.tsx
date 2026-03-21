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
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { uploadFile } from '@/lib/upload';
import { colors } from '@/lib/theme';
import { NotificationToast, type ToastData } from '@/components/NotificationToast';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { AudioMessage } from '@/components/AudioMessage';
import { VideoMessage } from '@/components/VideoMessage';
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

type AdminView = 'dashboard' | 'messages' | 'conversation' | 'submissions';

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

  const { codes, loadCodes, generateCode, deleteCode, isAdmin, setAdmin } = useAccessCodeStore();
  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

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
    }
    loadNotationPdfUrl();
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
            title: 'New Message from Participant',
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
        message: `Your AFeeree Certification Program access code is: ${code}\n\nDownload the app and enter this code to get started.`,
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
                Participant conversations
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
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 17 }}>No participants yet</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 6, textAlign: 'center' }}>
                Participants will appear once they join
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
                      setSelectedName(p.userName ?? 'Participant');
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
                Participant submissions will appear here once they complete assignments
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

                    {/* Date */}
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, marginBottom: 8 }}>
                      Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>

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
                          await Clipboard.setStringAsync(sub.fileUrl!);
                          Alert.alert('Link Copied', 'The file URL has been copied to your clipboard. Paste it in a browser to view.');
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
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Participant</Text>
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
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'View participant messages'}
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
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold[100], alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={24} color={colors.gold[600]} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Submissions</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                View files, videos & reflections
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
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>
              Enrolled Participants
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
