import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Play } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/lib/theme';

interface VideoModalProps {
  visible: boolean;
  onClose: () => void;
  vimeoId: string;
  title: string;
  subtitle?: string;
}

function getVimeoId(url: string): string {
  // Accepts full URL like https://vimeo.com/455075353 or just the ID
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : url;
}

export default function VideoModal({ visible, onClose, vimeoId, title, subtitle }: VideoModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const id = getVimeoId(vimeoId);
  const embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&color=C9963C&title=0&byline=0&portrait=0`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#111',
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Play size={14} color={colors.gold[400]} fill={colors.gold[400]} />
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  color: 'white',
                  fontSize: 16,
                  marginLeft: 8,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
            {subtitle ? (
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  marginTop: 2,
                  marginLeft: 22,
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color="white" />
          </Pressable>
        </Animated.View>

        {/* Video Player */}
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {loading && (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backgroundColor: '#000',
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(201,150,60,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Play size={24} color={colors.gold[400]} fill={colors.gold[400]} />
              </View>
              <ActivityIndicator color={colors.gold[400]} />
              <Text
                style={{
                  fontFamily: 'DMSans_400Regular',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading video...
              </Text>
            </View>
          )}
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1, backgroundColor: '#000' }}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            javaScriptEnabled
            allowsInlineMediaPlayback
          />
        </View>

        {/* Footer note */}
        <View style={{ paddingBottom: insets.bottom + 8, paddingTop: 8, backgroundColor: '#111' }}>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            AFeeree Certification Program · Confidential
          </Text>
        </View>
      </View>
    </Modal>
  );
}
