import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Play, Pause } from 'lucide-react-native';
import { colors } from '@/lib/theme';

interface Props {
  uri: string;
  isFromMe: boolean;
  duration?: number;
}

export function AudioMessage({ uri, isFromMe, duration }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);    // ms
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const progress = totalDuration > 0 ? position / totalDuration : 0;

  const progressAnim = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      setIsLoading(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            if (status.durationMillis) {
              setTotalDuration(status.durationMillis);
              progressAnim.value = withTiming(status.positionMillis / status.durationMillis);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              progressAnim.value = withTiming(0);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);
    } catch (e) {
      console.error('[AudioMessage] error', e);
      setIsLoading(false);
    }
  };

  const tint = isFromMe ? 'rgba(255,255,255,0.9)' : colors.primary[500];
  const trackColor = isFromMe ? 'rgba(255,255,255,0.3)' : colors.neutral[200];
  const fillColor = isFromMe ? 'rgba(255,255,255,0.9)' : colors.primary[400];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 160 }}>
      {/* Play/Pause button */}
      <Pressable
        onPress={handlePlayPause}
        style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: isFromMe ? 'rgba(255,255,255,0.2)' : colors.primary[100],
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {isLoading
          ? <ActivityIndicator size="small" color={tint} />
          : isPlaying
          ? <Pause size={16} color={tint} fill={tint} />
          : <Play size={16} color={tint} fill={tint} />
        }
      </Pressable>

      {/* Waveform track + time */}
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: trackColor, overflow: 'hidden', marginBottom: 4 }}>
          <Animated.View style={[{ height: '100%', borderRadius: 2, backgroundColor: fillColor }, progressStyle]} />
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: isFromMe ? 'rgba(255,255,255,0.7)' : colors.neutral[500] }}>
          {totalDuration > 0 ? formatMs(isPlaying ? position : totalDuration) : 'Voice note'}
        </Text>
      </View>
    </View>
  );
}
