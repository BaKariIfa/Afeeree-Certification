import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, User, MessageCircle, ChevronRight, Lock, LogOut, Video, Inbox, ExternalLink, Copy } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

import { colors } from '@/lib/theme';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useUserStore } from '@/lib/userStore';
import type { Participant } from '@/lib/types';
import { NotificationToast, type ToastData } from '@/components/NotificationToast';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { AudioMessage } from '@/components/AudioMessage';
import { VideoMessage } from '@/components/VideoMessage';
import { uploadFile } from '@/lib/upload';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

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

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const codes = useAccessCodeStore(s => s.codes);
  const loadCodes = useAccessCodeStore(s => s.loadCodes);
  const isAdmin = useAccessCodeStore(s => s.isAdmin);
  const userName = useUserStore(s => s.name);
  const accessCode = useUserStore(s => s.accessCode);

  const participants: Participant[] = codes
    .filter(c => c.userName)
    .map(c => ({
      id: c.code,
      name: c.userName!,
      email: c.userEmail ?? '',
      certificationLevel: 'Foundation' as const,
      progress: 0,
      lastActive: c.usedAt ?? c.createdAt ?? new Date().toISOString(),
    }));

  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [instructorView, setInstructorView] = useState<'participants' | 'submissions'>('participants');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [messages, setMessages] = useState<BackendMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Notification toast
  const [toast, setToast] = useState<ToastData | null>(null);
  const prevMessageCountRef = useRef(0);
  const prevUnreadTotalRef = useRef(-1); // -1 = not yet loaded, skip first poll
  const isInitialLoadRef = useRef(true);

  // Inline instructor login
  const [instructorPassword, setInstructorPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const setAdmin = useAccessCodeStore(s => s.setAdmin);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const fetchMessages = useCallback(async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${code}`);
      if (!res.ok) return;
      const data = await res.json() as { messages: BackendMessage[] };
      const newMsgs = data.messages;

      // Detect new message from admin → notify participant
      if (!isInitialLoadRef.current) {
        const newAdminMsgs = newMsgs.filter(m => m.senderId === 'admin');
        if (newAdminMsgs.length > prevMessageCountRef.current) {
          const latest = newAdminMsgs[newAdminMsgs.length - 1]!;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setToast({
            id: latest.id,
            title: 'BaKari Lindsay',
            body: latest.text,
          });
        }
        prevMessageCountRef.current = newAdminMsgs.length;
      } else {
        prevMessageCountRef.current = newMsgs.filter(m => m.senderId === 'admin').length;
        isInitialLoadRef.current = false;
      }

      setMessages(newMsgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('[fetchMessages]', e);
    }
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/unread-counts`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (!res.ok) return;
      const data = await res.json() as { counts: Record<string, number> };
      const newCounts = data.counts;
      const newTotal = Object.values(newCounts).reduce((s, n) => s + n, 0);

      // Detect new participant messages → notify instructor (skip first load)
      if (prevUnreadTotalRef.current >= 0 && newTotal > prevUnreadTotalRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setToast({
          id: `unread-${Date.now()}`,
          title: 'New Message',
          body: `You have ${newTotal} unread message${newTotal > 1 ? 's' : ''} from Kalandenw`,
        });
      }
      prevUnreadTotalRef.current = newTotal;
      setUnreadCounts(newCounts);
    } catch (e) {
      console.error('[fetchUnreadCounts]', e);
    }
  }, []);

  const markConversationRead = useCallback(async (code: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/messages/${code}/read`, {
        method: 'POST',
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      setUnreadCounts(prev => ({ ...prev, [code]: 0 }));
    } catch (e) {}
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions`);
      if (res.ok) {
        const data = await res.json() as { submissions: Submission[] };
        setSubmissions(data.submissions.reverse());
      }
    } catch {}
    finally { setIsLoadingSubmissions(false); }
  }, []);

  useEffect(() => {
    loadCodes();
    fetchUnreadCounts();
  }, []);

  const handleInstructorLogin = async () => {
    if (!instructorPassword.trim()) return;
    setIsLoggingIn(true);
    setLoginError('');
    if (instructorPassword.trim().toUpperCase() === ADMIN_PASSWORD) {
      await setAdmin(true);
      await loadCodes();
      await fetchUnreadCounts();
      setInstructorPassword('');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
    setIsLoggingIn(false);
  };

  const handleInstructorSignOut = async () => {
    await setAdmin(false);
    setSelectedParticipant(null);
    setInstructorView('participants');
    setMessages([]);
  };

  // Auto-load messages for participant view (anyone with an access code)
  useEffect(() => {
    if (accessCode) {
      setIsLoadingMessages(true);
      fetchMessages(accessCode).then(() => setIsLoadingMessages(false));
      const interval = setInterval(() => fetchMessages(accessCode), 10000);
      return () => clearInterval(interval);
    }
  }, [accessCode]);

  // Poll for new messages every 10 seconds (admin view)
  useEffect(() => {
    if (!isAdmin) return;
    if (!selectedParticipant) {
      const interval = setInterval(fetchUnreadCounts, 10000);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => fetchMessages(selectedParticipant.id), 10000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, selectedParticipant, fetchMessages, fetchUnreadCounts]);

  const handleSendMedia = useCallback(async (mediaUrl: string, mediaType: 'audio' | 'video') => {
    const isInstructorReplying = !!selectedParticipant;
    const conversationCode = selectedParticipant?.id ?? accessCode ?? '';
    const senderRole = isInstructorReplying ? 'admin' : 'participant';
    const senderName = isInstructorReplying ? 'BaKari Lindsay' : (userName ?? 'Kalanden');
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${conversationCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: senderRole, senderName, text: '', mediaUrl, mediaType }),
      });
      if (res.ok) {
        const data = await res.json() as { message: BackendMessage };
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('[sendMedia]', e);
    }
  }, [selectedParticipant, accessCode, userName]);

  const handleSendVideo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 60,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const filename = `video-${Date.now()}.mp4`;
      const uploaded = await uploadFile(asset.uri, filename, 'video/mp4');
      await handleSendMedia(uploaded.url, 'video');
    } catch (e) {
      console.error('[sendVideo]', e);
    }
  }, [handleSendMedia]);

  if (!fontsLoaded) return null;

  const handleSelectParticipant = async (participant: Participant) => {
    triggerHaptic();
    setSelectedParticipant(participant);
    setIsLoadingMessages(true);
    await fetchMessages(participant.id);
    setIsLoadingMessages(false);
    await markConversationRead(participant.id);
  };

  const handleBack = () => {
    triggerHaptic();
    if (selectedParticipant) {
      setSelectedParticipant(null);
      setMessages([]);
      fetchUnreadCounts();
    } else {
      router.push('/(tabs)/');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    triggerHaptic();
    setIsSending(true);

    // If replying to a selected participant → instructor sending. Otherwise → participant sending.
    const isInstructorReplying = !!selectedParticipant;
    const conversationCode = selectedParticipant?.id ?? accessCode ?? '';
    const senderRole = isInstructorReplying ? 'admin' : 'participant';
    const senderName = isInstructorReplying ? 'BaKari Lindsay' : (userName ?? 'Kalanden');

    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${conversationCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: senderRole,
          senderName,
          text: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json() as { message: BackendMessage };
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error('[sendMessage]', e);
    } finally {
      setIsSending(false);
    }
  };

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

  // ── INSTRUCTOR VIEW (isAdmin always takes priority, even if they have an access code) ──
  if (isAdmin) {
    // Conversation with a selected participant
    if (selectedParticipant) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
          <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
          <View style={{ paddingTop: insets.top + 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.neutral[200], paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={handleBack} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
                <ArrowLeft size={24} color={colors.neutral[800]} />
              </Pressable>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100] }}>
                <User size={20} color={colors.primary[500]} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                  {selectedParticipant.name}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12 }}>
                  {selectedParticipant.email}
                </Text>
              </View>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {isLoadingMessages ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <ActivityIndicator color={colors.primary[500]} />
                </View>
              ) : messages.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <MessageCircle size={48} color={colors.neutral[300]} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 16, marginTop: 16 }}>No messages yet</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                    Send a response to {selectedParticipant.name}
                  </Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isFromMe = msg.senderId === 'admin';
                  const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(messages[index - 1]!.timestamp);
                  return (
                    <View key={msg.id}>
                      {showDate && (
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400], fontSize: 12, textAlign: 'center', marginVertical: 16 }}>
                          {formatDate(msg.timestamp)}
                        </Text>
                      )}
                      <Animated.View
                        entering={FadeInUp.duration(300)}
                        style={{ marginBottom: 12, maxWidth: '80%', alignSelf: isFromMe ? 'flex-end' : 'flex-start' }}
                      >
                        {!isFromMe && (
                          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 11, marginBottom: 3 }}>
                            {msg.senderName}
                          </Text>
                        )}
                        <View style={{
                          paddingHorizontal: msg.mediaType ? 12 : 16, paddingVertical: msg.mediaType ? 10 : 12, borderRadius: 18,
                          backgroundColor: isFromMe ? colors.primary[500] : 'white',
                          borderBottomRightRadius: isFromMe ? 4 : 18,
                          borderBottomLeftRadius: isFromMe ? 18 : 4,
                        }}>
                          {msg.mediaType === 'audio' && msg.mediaUrl
                            ? <AudioMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                            : msg.mediaType === 'video' && msg.mediaUrl
                            ? <VideoMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                            : <Text style={{ fontFamily: 'DMSans_400Regular', color: isFromMe ? 'white' : colors.neutral[800], fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
                          }
                        </View>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, marginTop: 3, textAlign: isFromMe ? 'right' : 'left' }}>
                          {formatTime(msg.timestamp)}
                        </Text>
                      </Animated.View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={{ paddingBottom: insets.bottom + 8, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.neutral[200], paddingHorizontal: 16, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <VoiceNoteRecorder onSend={handleSendMedia} isFromMe={true} />
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
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
                <Pressable onPress={handleSendVideo} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] }}>
                  <Video size={20} color={colors.neutral[600]} />
                </Pressable>
                <Pressable
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: newMessage.trim() ? colors.primary[500] : colors.neutral[200],
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Send size={20} color={newMessage.trim() ? 'white' : colors.neutral[400]} />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      );
    }

    // Submissions view
    if (instructorView === 'submissions') {
      const typeBadge = (type: Submission['type']) => {
        if (type === 'video') return { label: 'Video', bg: colors.primary[100], color: colors.primary[500] };
        if (type === 'file') return { label: 'File', bg: colors.gold[100], color: colors.gold[600] };
        return { label: 'Reflection', bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
      };
      return (
        <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
          <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
          <View style={{ paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: colors.primary[500] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setInstructorView('participants')} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
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
                  Submissions appear here once Kalandenw complete their assignments
                </Text>
              </Animated.View>
            ) : (
              submissions.map((sub, i) => {
                const badge = typeBadge(sub.type);
                return (
                  <Animated.View key={sub.id} entering={FadeInDown.duration(400).delay(i * 60)}>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 15 }}>{sub.participantName}</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 2 }}>{sub.assignmentTitle}</Text>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: badge.bg, marginLeft: 8 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: badge.color, fontSize: 11 }}>{badge.label}</Text>
                        </View>
                      </View>
                      {sub.reflection ? (
                        <View style={{ backgroundColor: colors.neutral[50], borderRadius: 10, padding: 12, marginBottom: 8 }}>
                          <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[700], fontSize: 14, lineHeight: 20 }}>{sub.reflection}</Text>
                        </View>
                      ) : null}
                      {sub.fileUrl ? (
                        <Pressable
                          onPress={async () => {
                            triggerHaptic();
                            await WebBrowser.openBrowserAsync(sub.fileUrl!);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[50] ?? colors.primary[100], borderRadius: 10, padding: 12 }}
                        >
                          <ExternalLink size={16} color={colors.primary[500]} />
                          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                            {sub.fileName ?? 'View submitted file'}
                          </Text>
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

    // Participants list
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
            <Animated.View entering={FadeInDown.duration(600)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable onPress={handleBack} style={{ marginRight: 16, padding: 8, marginLeft: -8 }}>
                  <ArrowLeft size={24} color={colors.neutral[800]} />
                </Pressable>
                <View>
                  <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 32 }}>
                    Feedback
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginTop: 2 }}>
                    Jeli View
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginTop: 1 }}>
                    A respected transmitter of history, culture, and embodied wisdom
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleInstructorSignOut}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[100], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <LogOut size={16} color={colors.neutral[600]} />
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], fontSize: 13, marginLeft: 6 }}>Sign Out</Text>
              </Pressable>
            </Animated.View>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            {/* Submissions card */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <Pressable
                onPress={() => { triggerHaptic(); fetchSubmissions(); setInstructorView('submissions'); }}
                style={{
                  backgroundColor: colors.gold[50] ?? colors.gold[100],
                  borderRadius: 16, padding: 16, marginBottom: 20,
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1.5, borderColor: colors.gold[200] ?? colors.gold[300],
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
                <ChevronRight size={20} color={colors.gold[500]} />
              </Pressable>
            </Animated.View>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 18 }}>
                Kalandenw
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginTop: 0, marginBottom: 14 }}>
                One who studies, absorbs, and prepares to carry forward tradition
              </Text>
            </View>

            {participants.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingVertical: 64 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <User size={40} color={colors.neutral[300]} />
                </View>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 18, textAlign: 'center' }}>
                  No Kalandenw yet
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                  Kalandenw will appear here once they join the program
                </Text>
              </Animated.View>
            ) : (
              participants.map((participant, index) => {
                const unread = unreadCounts[participant.id] ?? 0;
                return (
                  <Animated.View key={participant.id} entering={FadeInUp.duration(500).delay(100 + index * 100)}>
                    <Pressable
                      onPress={() => handleSelectParticipant(participant)}
                      style={{
                        marginBottom: 12, padding: 16, borderRadius: 16,
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: 'white',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                      }}
                    >
                      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100] }}>
                        <User size={24} color={colors.primary[500]} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                            {participant.name}
                          </Text>
                          {unread > 0 && (
                            <View style={{ backgroundColor: colors.primary[500], borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 11 }}>{unread}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                          {participant.email}
                        </Text>
                        {unread > 0 && (
                          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginTop: 4 }}>
                            {unread} new message{unread > 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={20} color={colors.neutral[400]} />
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── PARTICIPANT VIEW: non-admin with an access code ──
  if (accessCode) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
        <View style={{ paddingTop: insets.top + 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.neutral[200], paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.push('/(tabs)/')} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100] }}>
              <User size={20} color={colors.primary[500]} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>Message Your Jeli</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 10, fontStyle: 'italic', marginTop: 1 }}>A respected transmitter of history, culture, and embodied wisdom</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 12, marginTop: 2 }}>BaKari Lindsay · AFeeree</Text>
            </View>
          </View>
        </View>
        <ParticipantConversation
          conversationCode={accessCode}
          participantName={userName ?? 'Kalanden'}
          messages={messages}
          isLoading={isLoadingMessages}
          newMessage={newMessage}
          isSending={isSending}
          scrollViewRef={scrollViewRef}
          onChangeText={setNewMessage}
          onSend={handleSendMessage}
          onSendMedia={handleSendMedia}
          formatTime={formatTime}
          formatDate={formatDate}
          insets={insets}
          fontsLoaded={fontsLoaded}
          onMount={() => {}}
        />
      </View>
    );
  }
  if (!isAdmin && !accessCode) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}>
          <Animated.View entering={FadeInDown.duration(600)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.push('/(tabs)/')} style={{ marginRight: 16, padding: 8, marginLeft: -8 }}>
              <ArrowLeft size={24} color={colors.neutral[800]} />
            </Pressable>
            <View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 28 }}>
                Feedback
              </Text>
            </View>
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 }}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Lock size={36} color={colors.primary[600]} />
              </View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 26, textAlign: 'center', marginBottom: 4 }}>
                Jeli Access
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 10 }}>
                A respected transmitter of history, culture, and embodied wisdom
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                Sign in with your Jeli password to view Kalanden messages and respond
              </Text>
            </View>

            <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[700], fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                Jeli Password
              </Text>
              <TextInput
                value={instructorPassword}
                onChangeText={(t) => { setInstructorPassword(t); setLoginError(''); }}
                placeholder="Enter password..."
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry
                autoCapitalize="none"
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: colors.neutral[800],
                  backgroundColor: colors.neutral[50],
                  borderWidth: 1.5,
                  borderColor: loginError ? '#ef4444' : colors.neutral[200],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  marginBottom: loginError ? 8 : 20,
                }}
              />
              {loginError ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                  {loginError}
                </Text>
              ) : null}

              <Pressable
                onPress={handleInstructorLogin}
                disabled={!instructorPassword.trim() || isLoggingIn}
                style={{
                  backgroundColor: instructorPassword.trim() ? colors.primary[600] : colors.neutral[200],
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', color: instructorPassword.trim() ? 'white' : colors.neutral[400], fontSize: 16 }}>
                    Sign In as Jeli
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Participants list view (admin) ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 16 }}>
          <Animated.View entering={FadeInDown.duration(600)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={handleBack} style={{ marginRight: 16, padding: 8, marginLeft: -8 }}>
                <ArrowLeft size={24} color={colors.neutral[800]} />
              </Pressable>
              <View>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: colors.neutral[800], fontSize: 32 }}>
                  Feedback
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 14, marginTop: 2 }}>
                  Jeli View
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginTop: 1 }}>
                  A respected transmitter of history, culture, and embodied wisdom
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleInstructorSignOut}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[100], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <LogOut size={16} color={colors.neutral[600]} />
              <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[600], fontSize: 13, marginLeft: 6 }}>Sign Out</Text>
            </Pressable>
          </Animated.View>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 18 }}>
              Kalandenw
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 11, fontStyle: 'italic', marginTop: 0, marginBottom: 14 }}>
              One who studies, absorbs, and prepares to carry forward tradition
            </Text>
          </View>

          {participants.length === 0 ? (
            <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', paddingVertical: 64 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <User size={40} color={colors.neutral[300]} />
              </View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[600], fontSize: 18, textAlign: 'center' }}>
                No Kalandenw yet
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                Kalandenw will appear here once they join the program
              </Text>
            </Animated.View>
          ) : (
            participants.map((participant, index) => {
              const unread = unreadCounts[participant.id] ?? 0;
              return (
                <Animated.View key={participant.id} entering={FadeInUp.duration(500).delay(100 + index * 100)}>
                  <Pressable
                    onPress={() => handleSelectParticipant(participant)}
                    style={{
                      marginBottom: 12, padding: 16, borderRadius: 16,
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: 'white',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[100] }}>
                      <User size={24} color={colors.primary[500]} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.neutral[800], fontSize: 16 }}>
                          {participant.name}
                        </Text>
                        {unread > 0 && (
                          <View style={{ backgroundColor: colors.primary[500], borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 11 }}>{unread}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[500], fontSize: 13, marginTop: 2 }}>
                        {participant.email}
                      </Text>
                      {unread > 0 && (
                        <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.primary[500], fontSize: 13, marginTop: 4 }}>
                          {unread} new message{unread > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>

                    <ChevronRight size={20} color={colors.neutral[400]} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Participant conversation sub-component ──
function ParticipantConversation({
  conversationCode, participantName, messages, isLoading,
  newMessage, isSending, scrollViewRef, onChangeText, onSend, onSendMedia,
  formatTime, formatDate, insets, fontsLoaded, onMount,
}: {
  conversationCode: string;
  participantName: string;
  messages: BackendMessage[];
  isLoading: boolean;
  newMessage: string;
  isSending: boolean;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onChangeText: (t: string) => void;
  onSend: () => void;
  onSendMedia: (url: string, type: 'audio' | 'video') => Promise<void>;
  formatTime: (t: string) => string;
  formatDate: (t: string) => string;
  insets: { bottom: number };
  fontsLoaded: boolean;
  onMount: () => void;
}) {
  useEffect(() => { onMount(); }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <MessageCircle size={48} color={colors.neutral[300]} />
            <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 16, marginTop: 16 }}>No messages yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[400], fontSize: 14, marginTop: 4, textAlign: 'center' }}>
              Send a message to your Jeli
            </Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const isFromMe = msg.senderId === 'participant';
            const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(messages[index - 1]!.timestamp);
            return (
              <View key={msg.id}>
                {showDate && (
                  <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400], fontSize: 12, textAlign: 'center', marginVertical: 16 }}>
                    {formatDate(msg.timestamp)}
                  </Text>
                )}
                <View style={{ marginBottom: 12, maxWidth: '80%', alignSelf: isFromMe ? 'flex-end' : 'flex-start' }}>
                  {!isFromMe && (
                    <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[500], fontSize: 11, marginBottom: 3 }}>
                      {msg.senderName}
                    </Text>
                  )}
                  <View style={{
                    paddingHorizontal: msg.mediaType ? 12 : 16, paddingVertical: msg.mediaType ? 10 : 12, borderRadius: 18,
                    backgroundColor: isFromMe ? colors.primary[500] : 'white',
                    borderBottomRightRadius: isFromMe ? 4 : 18,
                    borderBottomLeftRadius: isFromMe ? 18 : 4,
                  }}>
                    {msg.mediaType === 'audio' && msg.mediaUrl
                      ? <AudioMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                      : msg.mediaType === 'video' && msg.mediaUrl
                      ? <VideoMessage uri={msg.mediaUrl} isFromMe={isFromMe} />
                      : <Text style={{ fontFamily: 'DMSans_400Regular', color: isFromMe ? 'white' : colors.neutral[800], fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
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

      <View style={{ paddingBottom: insets.bottom + 8, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.neutral[200], paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <VoiceNoteRecorder onSend={onSendMedia} isFromMe={false} />
          <TextInput
            value={newMessage}
            onChangeText={onChangeText}
            placeholder="Type a message..."
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
            onPress={async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') return;
              const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 60, quality: 0.7 });
              if (result.canceled || !result.assets[0]) return;
              const asset = result.assets[0];
              try {
                const uploaded = await uploadFile(asset.uri, `video-${Date.now()}.mp4`, 'video/mp4');
                await onSendMedia(uploaded.url, 'video');
              } catch {}
            }}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] }}
          >
            <Video size={20} color={colors.neutral[600]} />
          </Pressable>
          <Pressable
            onPress={onSend}
            disabled={!newMessage.trim() || isSending}
            style={{
              width: 44, height: 44, borderRadius: 22,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: newMessage.trim() ? colors.primary[500] : colors.neutral[200],
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color={newMessage.trim() ? 'white' : colors.neutral[400]} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
