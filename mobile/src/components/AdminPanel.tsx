import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Modal, FlatList, Share, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Key, Plus, Copy, Trash2, Share2, ShieldCheck, Users, Check, FileText, Upload, CheckCircle, CreditCard, Globe, Video } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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

  const codes = useAccessCodeStore(s => s.codes);
  const loadCodes = useAccessCodeStore(s => s.loadCodes);
  const generateCode = useAccessCodeStore(s => s.generateCode);
  const deleteCode = useAccessCodeStore(s => s.deleteCode);

  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  const researchDocUrl = useResourcesStore(s => s.researchDocUrl);
  const researchVideoId = useResourcesStore(s => s.researchVideoId);
  const setResearchDocUrl = useResourcesStore(s => s.setResearchDocUrl);
  const setResearchVideoId = useResourcesStore(s => s.setResearchVideoId);
  const loadResources = useResourcesStore(s => s.loadResources);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (visible && isAuthenticated) {
      loadCodes();
      loadNotationPdfUrl();
      loadResources();
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
    }
  }, [visible]);

  const handleLogin = () => {
    if (password.toUpperCase() === ADMIN_PASSWORD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
      setPasswordError('');
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
        message: `Your AFeeree Certification Program access code is: ${code}\n\nDownload the app and enter this code to get started.`,
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
    await setResearchVideoId(id);
    setVideoIdSaved(true);
    setTimeout(() => setVideoIdSaved(false), 3000);
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);

  if (!fontsLoaded) return null;

  const renderCodeItem = ({ item }: { item: AccessCode }) => (
    <Animated.View
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
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white' }}
              className="text-xl ml-3"
            >
              Admin Panel
            </Text>
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
                Admin Access
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
        ) : (
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

              {researchVideoId && !videoIdInput ? (
                <View className="flex-row items-center p-3 rounded-xl mb-3" style={{ backgroundColor: colors.gold[50] }}>
                  <CheckCircle size={16} color={colors.gold[600]} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: colors.neutral[600], marginLeft: 8, fontSize: 12 }}>
                    Current ID: {researchVideoId}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center px-4 py-3 rounded-xl mb-3" style={{ backgroundColor: colors.neutral[100] }}>
                <TextInput
                  value={videoIdInput}
                  onChangeText={setVideoIdInput}
                  placeholder={researchVideoId ?? 'Enter Vimeo video ID (e.g. 123456789)'}
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
              <View className="flex-1 items-center justify-center">
                <Key size={48} color={colors.neutral[300]} />
                <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[400] }} className="text-base mt-4 text-center">
                  No codes yet.{'\n'}Tap the button above to generate one!
                </Text>
              </View>
            ) : (
              <FlatList
                data={[...unusedCodes, ...usedCodes]}
                renderItem={renderCodeItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
