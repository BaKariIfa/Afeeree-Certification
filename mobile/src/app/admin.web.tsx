import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Plus, Trash2, Copy, Check, FileText, Upload, CheckCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useAccessCodeStore, ADMIN_PASSWORD } from '@/lib/accessCodeStore';
import { useNotationStore } from '@/lib/notationStore';
import { uploadFile } from '@/lib/upload';

export default function AdminScreen() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCodeMessage, setNewCodeMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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
      alert('Incorrect password');
    }
  };

  const handleGenerateCode = async () => {
    const code = await generateCode();
    setNewCodeMessage(`New code generated: ${code}`);
    setTimeout(() => setNewCodeMessage(null), 5000);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCode = (code: string) => {
    if (confirmDelete === code) {
      deleteCode(code);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(code);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleUploadNotation = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const uploaded = await uploadFile(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/pdf'
      );
      await setNotationPdfUrl(uploaded.url);
      setUploadMessage(`"${asset.name}" uploaded successfully.`);
      setTimeout(() => setUploadMessage(null), 5000);
    } catch (err) {
      setUploadMessage('Upload failed. Please try again.');
      setTimeout(() => setUploadMessage(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const unusedCodes = codes.filter(c => !c.usedBy);
  const usedCodes = codes.filter(c => c.usedBy);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 400, alignSelf: 'center', width: '100%' }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 80, height: 80, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={40} color="#F59E0B" />
            </View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>JELI Panel</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>AFeeree Certification</Text>
            <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Enter password to continue</Text>
          </View>

          <TextInput
            style={{ backgroundColor: '#1F2937', color: 'white', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, fontSize: 18, marginBottom: 16 }}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <Pressable
            style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
            onPress={handleLogin}
          >
            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>JELI Panel</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>AFeeree Certification</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, maxWidth: 600, alignSelf: 'center', width: '100%' }}>

        {/* Notation File Upload */}
        <View style={{ marginTop: 24, backgroundColor: '#1F2937', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FileText size={20} color="#F59E0B" />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>Notation File</Text>
          </View>

          {notationPdfUrl ? (
            <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, padding: 12 }}>
              <CheckCircle size={18} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600' }}>File uploaded</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {notationPdfUrl.split('/').pop()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: 12, backgroundColor: 'rgba(55,65,81,0.5)', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
                No notation file uploaded yet.{'\n'}Currently using Google Drive links.
              </Text>
            </View>
          )}

          {uploadMessage && (
            <View style={{ marginBottom: 12, backgroundColor: uploadMessage.includes('failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: uploadMessage.includes('failed') ? '#EF4444' : '#10B981', fontSize: 14, textAlign: 'center' }}>
                {uploadMessage}
              </Text>
            </View>
          )}

          <Pressable
            style={{ backgroundColor: isUploading ? '#374151' : '#F59E0B', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            onPress={handleUploadNotation}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Upload size={18} color="#000" />
                <Text style={{ color: 'black', fontWeight: 'bold', marginLeft: 8 }}>
                  {notationPdfUrl ? 'Replace Notation File' : 'Upload Notation File'}
                </Text>
              </>
            )}
          </Pressable>
          <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Supports PDF and image files
          </Text>
        </View>

        {/* Generate Button */}
        <Pressable
          style={{ backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}
          onPress={handleGenerateCode}
        >
          <Plus size={24} color="#000" />
          <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>Generate New Code</Text>
        </Pressable>

        {newCodeMessage && (
          <View style={{ backgroundColor: '#065F46', padding: 16, borderRadius: 12, marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{newCodeMessage}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginTop: 24, gap: 16 }}>
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
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 }}>Available Codes</Text>
        {unusedCodes.length === 0 ? (
          <View style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>No codes available. Generate one above.</Text>
          </View>
        ) : (
          unusedCodes.map((item) => (
            <View
              key={item.code}
              style={{ backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View>
                <Text style={{ color: 'white', fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold' }}>{item.code}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={{ backgroundColor: '#374151', padding: 12, borderRadius: 8 }}
                  onPress={() => handleCopyCode(item.code)}
                >
                  {copiedCode === item.code ? (
                    <Check size={20} color="#10B981" />
                  ) : (
                    <Copy size={20} color="#fff" />
                  )}
                </Pressable>
                <Pressable
                  style={{ backgroundColor: confirmDelete === item.code ? '#EF4444' : 'rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8 }}
                  onPress={() => handleDeleteCode(item.code)}
                >
                  <Trash2 size={20} color={confirmDelete === item.code ? '#fff' : '#EF4444'} />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 }}>Used Codes</Text>
            {usedCodes.map((item) => (
              <View
                key={item.code}
                style={{ backgroundColor: 'rgba(31, 41, 55, 0.5)', padding: 16, borderRadius: 12, marginBottom: 12 }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 18, fontFamily: 'monospace', textDecorationLine: 'line-through' }}>{item.code}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Used by: {item.usedBy}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  Used on: {item.usedAt ? new Date(item.usedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
