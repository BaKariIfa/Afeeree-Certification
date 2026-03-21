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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Plus, Trash2, Copy, Check, ArrowLeft, FileText, Upload, CheckCircle, MessageCircle, Send, User, ChevronRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { uploadFile } from '@/lib/upload';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

interface BackendMessage {
  id: string;
  senderId: 'participant' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  readByAdmin: boolean;
  readByParticipant: boolean;
}

type AdminView = 'dashboard' | 'messages' | 'conversation';

export default function AdminScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const { codes, loadCodes, generateCode, deleteCode, isAdmin, setAdmin } = useAccessCodeStore();
  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
      loadCodes();
      fetchUnreadCounts();
    }
    loadNotationPdfUrl();
  }, [isAdmin]);

  // Poll unread counts on messages view
  useEffect(() => {
    if (!isAuthenticated || adminView !== 'messages') return;
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminView]);

  // Poll conversation messages
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
        setUnreadCounts(data.counts);
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
      setIsAuthenticated(true);
      setAdmin(true);
      loadCodes();
      fetchUnreadCounts();
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
  };

  const handleGenerateCode = async () => {
    const code = await generateCode();
    Alert.alert('Code Generated', `New code: ${code}`);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCode = (code: string) => {
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
    const asset = result.assets[0];
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
      await setNotationPdfUrl(uploaded.url);
      Alert.alert('Success', `"${asset.name}" uploaded and saved to the app.`);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);
  const participants = codes.filter(c => c.userName);
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  // ── Password screen ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 80, height: 80, backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={40} color="#F59E0B" />
            </View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Admin Access</Text>
            <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Enter password to continue</Text>
          </View>

          <TextInput
            style={{ backgroundColor: '#1F2937', color: 'white', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, fontSize: 18, marginBottom: 16 }}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            autoCapitalize="characters"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <Pressable style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }} onPress={handleLogin}>
            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>Login</Text>
          </Pressable>

          <Pressable style={{ marginTop: 24, alignItems: 'center' }} onPress={() => router.back()}>
            <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Messages list view ──
  if (adminView === 'messages') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
          <Pressable onPress={() => { setAdminView('dashboard'); fetchUnreadCounts(); }} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Messages</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {participants.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <User size={48} color="#374151" />
              <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 16 }}>No participants yet</Text>
            </View>
          ) : (
            participants.map(p => {
              const unread = unreadCounts[p.code] ?? 0;
              return (
                <Pressable
                  key={p.code}
                  onPress={async () => {
                    setSelectedCode(p.code);
                    setSelectedName(p.userName ?? 'Participant');
                    setIsLoadingMessages(true);
                    setAdminView('conversation');
                    await fetchConvMessages(p.code);
                    setIsLoadingMessages(false);
                    await markRead(p.code);
                  }}
                  style={{ backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} color="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{p.userName}</Text>
                      {unread > 0 && (
                        <View style={{ backgroundColor: '#F59E0B', borderRadius: 10, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: 'black', fontSize: 12, fontWeight: 'bold' }}>{unread}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{p.userEmail}</Text>
                    {unread > 0 && (
                      <Text style={{ color: '#F59E0B', fontSize: 13, marginTop: 4 }}>{unread} new message{unread > 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  <ChevronRight size={20} color="#4B5563" />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Conversation view ──
  if (adminView === 'conversation') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
          <Pressable onPress={() => { setAdminView('messages'); fetchUnreadCounts(); }} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <User size={18} color="#9CA3AF" />
          </View>
          <View>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{selectedName}</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>Participant</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
            {isLoadingMessages ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <ActivityIndicator color="#F59E0B" />
              </View>
            ) : convMessages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <MessageCircle size={48} color="#374151" />
                <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 16 }}>No messages yet</Text>
              </View>
            ) : (
              convMessages.map((msg, index) => {
                const isFromMe = msg.senderId === 'admin';
                const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(convMessages[index - 1]!.timestamp);
                return (
                  <View key={msg.id}>
                    {showDate && (
                      <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginVertical: 12 }}>{formatDate(msg.timestamp)}</Text>
                    )}
                    <View style={{ marginBottom: 10, maxWidth: '80%', alignSelf: isFromMe ? 'flex-end' : 'flex-start' }}>
                      {!isFromMe && (
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 3 }}>{msg.senderName}</Text>
                      )}
                      <View style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
                        backgroundColor: isFromMe ? '#F59E0B' : '#1F2937',
                        borderBottomRightRadius: isFromMe ? 4 : 18,
                        borderBottomLeftRadius: isFromMe ? 18 : 4,
                      }}>
                        <Text style={{ color: isFromMe ? 'black' : 'white', fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
                      </View>
                      <Text style={{ color: '#4B5563', fontSize: 11, marginTop: 2, textAlign: isFromMe ? 'right' : 'left' }}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1F2937' }}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your response..."
              placeholderTextColor="#4B5563"
              multiline
              style={{ flex: 1, backgroundColor: '#1F2937', color: 'white', borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 100, fontSize: 15 }}
            />
            <Pressable
              onPress={handleSend}
              disabled={!newMessage.trim() || isSending}
              style={{ marginLeft: 8, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: newMessage.trim() ? '#F59E0B' : '#374151' }}
            >
              {isSending ? <ActivityIndicator size="small" color="black" /> : <Send size={20} color={newMessage.trim() ? 'black' : '#6B7280'} />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Dashboard ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>Access Code Admin</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Messages Card */}
        <Pressable
          onPress={() => { fetchUnreadCounts(); setAdminView('messages'); }}
          style={{ backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: totalUnread > 0 ? 1 : 0, borderColor: '#F59E0B' }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: totalUnread > 0 ? 'rgba(245,158,11,0.2)' : '#374151', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={22} color={totalUnread > 0 ? '#F59E0B' : '#9CA3AF'} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Messages</Text>
            <Text style={{ color: totalUnread > 0 ? '#F59E0B' : '#6B7280', fontSize: 13, marginTop: 2 }}>
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'View participant messages'}
            </Text>
          </View>
          {totalUnread > 0 && (
            <View style={{ backgroundColor: '#F59E0B', borderRadius: 12, minWidth: 26, height: 26, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13 }}>{totalUnread}</Text>
            </View>
          )}
          <ChevronRight size={20} color="#4B5563" />
        </Pressable>

        {/* Notation File Upload */}
        <View style={{ backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FileText size={20} color="#F59E0B" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Notation File</Text>
          </View>
          {notationPdfUrl ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8, flex: 1 }} numberOfLines={1}>{notationPdfUrl.split('/').pop()}</Text>
            </View>
          ) : (
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 12 }}>No file uploaded yet.</Text>
          )}
          <Pressable
            style={{ backgroundColor: isUploading ? '#374151' : '#F59E0B', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            onPress={handleUploadNotation}
            disabled={isUploading}
          >
            {isUploading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Upload size={16} color="black" />
                <Text style={{ color: 'black', fontWeight: 'bold', marginLeft: 8 }}>{notationPdfUrl ? 'Replace File' : 'Upload Notation File'}</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Generate Button */}
        <Pressable
          style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}
          onPress={handleGenerateCode}
        >
          <Plus size={24} color="black" />
          <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Generate New Code</Text>
        </Pressable>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#1F2937', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#9CA3AF' }}>Available</Text>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>{unusedCodes.length}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#1F2937', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#9CA3AF' }}>Used</Text>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>{usedCodes.length}</Text>
          </View>
        </View>

        {/* Available Codes */}
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Available Codes</Text>
        {unusedCodes.length === 0 ? (
          <View style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 16 }}>
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>No codes available. Generate one above.</Text>
          </View>
        ) : (
          unusedCodes.map(item => (
            <View key={item.code} style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: 'white', fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' }}>{item.code}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={{ backgroundColor: '#374151', padding: 10, borderRadius: 8 }} onPress={() => handleCopyCode(item.code)}>
                  {copiedCode === item.code ? <Check size={20} color="#10B981" /> : <Copy size={20} color="white" />}
                </Pressable>
                <Pressable style={{ backgroundColor: 'rgba(239,68,68,0.2)', padding: 10, borderRadius: 8 }} onPress={() => handleDeleteCode(item.code)}>
                  <Trash2 size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 12 }}>Used Codes</Text>
            {usedCodes.map(item => (
              <View key={item.code} style={{ backgroundColor: 'rgba(31,41,55,0.5)', padding: 16, borderRadius: 12, marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', fontSize: 16, textDecorationLine: 'line-through' }}>{item.code}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Used by: {item.usedBy}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Used on: {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : 'N/A'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
