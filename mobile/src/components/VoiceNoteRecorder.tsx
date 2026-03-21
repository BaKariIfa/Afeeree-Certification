import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { uploadFile } from '@/lib/upload';

interface Props {
  onSend: (mediaUrl: string, mediaType: 'audio') => Promise<void>;
  isFromMe: boolean;
}

export function VoiceNoteRecorder({ onSend, isFromMe }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [seconds, setSeconds] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording') {
      pulseScale.value = withRepeat(withTiming(1.35, { duration: 700 }), -1, true);
      pulseOpacity.value = withRepeat(withTiming(0.3, { duration: 700 }), -1, true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(1);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setState('recording');
    } catch (e) {
      console.error('[VoiceNote] start error', e);
    }
  };

  const stopAndSend = async () => {
    if (!recordingRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('uploading');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { setState('idle'); return; }
      const filename = `voice-${Date.now()}.m4a`;
      const uploaded = await uploadFile(uri, filename, 'audio/m4a');
      await onSend(uploaded.url, 'audio');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[VoiceNote] stop/upload error', e);
    } finally {
      setState('idle');
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
    } catch {}
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('idle');
  };

  if (state === 'recording') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Cancel */}
        <Pressable
          onPress={cancelRecording}
          style={{
            width: 40, height: 40, borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.1)',
          }}
        >
          <MicOff size={18} color="#ef4444" />
        </Pressable>

        {/* Timer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' }} />
          <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.neutral[700], fontSize: 14, minWidth: 32 }}>
            {formatSeconds(seconds)}
          </Text>
        </View>

        {/* Stop & Send */}
        <Pressable
          onPress={stopAndSend}
          style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.primary[500],
          }}
        >
          <Square size={16} color="white" fill="white" />
        </Pressable>
      </View>
    );
  }

  if (state === 'uploading') {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] }}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={{ position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{
        position: 'absolute',
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.neutral[300],
      }, pulseStyle]} />
      <Pressable
        onPress={startRecording}
        style={{
          width: 44, height: 44, borderRadius: 22,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.neutral[200],
        }}
      >
        <Mic size={20} color={colors.neutral[600]} />
      </Pressable>
    </View>
  );
}
