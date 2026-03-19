import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Plus, Trash2, Copy, Check, ArrowLeft, FileText, Upload, CheckCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { uploadFile } from '@/lib/upload';

export default function AdminScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { codes, loadCodes, generateCode, deleteCode, isAdmin, setAdmin } = useAccessCodeStore();
  const notationPdfUrl = useNotationStore(s => s.notationPdfUrl);
  const setNotationPdfUrl = useNotationStore(s => s.setNotationPdfUrl);
  const loadNotationPdfUrl = useNotationStore(s => s.loadNotationPdfUrl);

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
      loadCodes();
    }
    loadNotationPdfUrl();
  }, [isAdmin]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdmin(true);
      loadCodes();
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
    Alert.alert(
      'Delete Code',
      `Are you sure you want to delete ${code}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCode(code) },
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
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/pdf'
      );
      await setNotationPdfUrl(uploaded.url);
      Alert.alert('Success', `"${asset.name}" uploaded and saved to the app.`);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center mb-4">
              <Lock size={40} color="#F59E0B" />
            </View>
            <Text className="text-white text-2xl font-bold">Admin Access</Text>
            <Text className="text-gray-400 mt-2">Enter password to continue</Text>
          </View>

          <TextInput
            className="bg-gray-800 text-white px-4 py-4 rounded-xl text-lg mb-4"
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <Pressable
            className="bg-amber-500 py-4 rounded-xl items-center"
            onPress={handleLogin}
          >
            <Text className="text-black font-bold text-lg">Login</Text>
          </Pressable>

          <Pressable
            className="mt-6 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-gray-400">Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-row items-center px-4 py-4 border-b border-gray-800">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-white text-xl font-bold ml-2">Access Code Admin</Text>
      </View>

      <ScrollView className="flex-1 px-4">

        {/* Notation File Upload */}
        <View className="mt-6 bg-gray-800 rounded-2xl p-4">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#F59E0B" />
            <Text className="text-white text-lg font-bold ml-2">Notation File</Text>
          </View>

          {notationPdfUrl ? (
            <View className="mb-3 flex-row items-start bg-green-500/10 rounded-xl p-3">
              <CheckCircle size={18} color="#10B981" style={{ marginTop: 2 }} />
              <View className="flex-1 ml-2">
                <Text className="text-green-400 text-sm font-semibold">File uploaded</Text>
                <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                  {notationPdfUrl.split('/').pop()}
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-3 bg-gray-700/50 rounded-xl p-3">
              <Text className="text-gray-400 text-sm text-center">
                No notation file uploaded yet.{'\n'}Currently using Google Drive links.
              </Text>
            </View>
          )}

          <Pressable
            className="py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: isUploading ? '#374151' : '#F59E0B' }}
            onPress={handleUploadNotation}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Upload size={18} color={isUploading ? '#9CA3AF' : '#000'} />
                <Text className="text-black font-bold ml-2">
                  {notationPdfUrl ? 'Replace Notation File' : 'Upload Notation File'}
                </Text>
              </>
            )}
          </Pressable>
          <Text className="text-gray-500 text-xs text-center mt-2">
            Supports PDF and image files · Saved to all participants instantly
          </Text>
        </View>

        {/* Generate Button */}
        <Pressable
          className="bg-amber-500 py-4 rounded-xl items-center flex-row justify-center mt-6"
          onPress={handleGenerateCode}
        >
          <Plus size={24} color="#000" />
          <Text className="text-black font-bold text-lg ml-2">Generate New Code</Text>
        </Pressable>

        {/* Stats */}
        <View className="flex-row mt-6 gap-4">
          <View className="flex-1 bg-gray-800 p-4 rounded-xl">
            <Text className="text-gray-400">Available</Text>
            <Text className="text-white text-3xl font-bold">{unusedCodes.length}</Text>
          </View>
          <View className="flex-1 bg-gray-800 p-4 rounded-xl">
            <Text className="text-gray-400">Used</Text>
            <Text className="text-white text-3xl font-bold">{usedCodes.length}</Text>
          </View>
        </View>

        {/* Available Codes */}
        <Text className="text-white text-lg font-bold mt-6 mb-3">Available Codes</Text>
        {unusedCodes.length === 0 ? (
          <View className="bg-gray-800 p-4 rounded-xl">
            <Text className="text-gray-400 text-center">No codes available. Generate one above.</Text>
          </View>
        ) : (
          unusedCodes.map((item) => (
            <View
              key={item.code}
              className="bg-gray-800 p-4 rounded-xl mb-3 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-white text-lg font-mono font-bold">{item.code}</Text>
                <Text className="text-gray-400 text-sm">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  className="bg-gray-700 p-3 rounded-lg"
                  onPress={() => handleCopyCode(item.code)}
                >
                  {copiedCode === item.code ? (
                    <Check size={20} color="#10B981" />
                  ) : (
                    <Copy size={20} color="#fff" />
                  )}
                </Pressable>
                <Pressable
                  className="bg-red-500/20 p-3 rounded-lg"
                  onPress={() => handleDeleteCode(item.code)}
                >
                  <Trash2 size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <>
            <Text className="text-white text-lg font-bold mt-6 mb-3">Used Codes</Text>
            {usedCodes.map((item) => (
              <View
                key={item.code}
                className="bg-gray-800/50 p-4 rounded-xl mb-3"
              >
                <Text className="text-gray-400 text-lg font-mono line-through">{item.code}</Text>
                <Text className="text-gray-500 text-sm">
                  Used by: {item.usedBy}
                </Text>
                <Text className="text-gray-500 text-sm">
                  Used on: {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
