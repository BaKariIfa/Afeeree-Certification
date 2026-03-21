import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play, X } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  uri: string;
  isFromMe: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_W = Math.min(SCREEN_W * 0.55, 220);

export function VideoMessage({ uri, isFromMe }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable onPress={() => setFullscreen(true)} style={{ position: 'relative' }}>
        <View style={{
          width: THUMB_W,
          height: THUMB_W * 0.65,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}>
          <Video
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
          />
          {/* Overlay */}
          <View style={{
            position: 'absolute', inset: 0,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.28)',
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.9)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Play size={20} color={colors.primary[500]} fill={colors.primary[500]} />
            </View>
          </View>
        </View>
        <Text style={{
          fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 3,
          color: isFromMe ? 'rgba(255,255,255,0.65)' : colors.neutral[400],
        }}>
          Video note · tap to play
        </Text>
      </Pressable>

      {/* Fullscreen player */}
      <Modal visible={fullscreen} animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Pressable
            onPress={() => setFullscreen(false)}
            style={{
              position: 'absolute', top: insets.top + 12, right: 16,
              zIndex: 10, width: 40, height: 40, borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={22} color="white" />
          </Pressable>
          <Video
            source={{ uri }}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            useNativeControls
          />
        </View>
      </Modal>
    </>
  );
}
