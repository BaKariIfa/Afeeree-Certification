import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Play, Lock } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/lib/theme';

const PREVIEW_LIMIT_SECONDS = 60;

interface VideoModalProps {
  visible: boolean;
  onClose: () => void;
  vimeoId: string;
  title: string;
  subtitle?: string;
  previewMode?: boolean;
}

function getVimeoId(url: string): string {
  // Accepts full URL like https://vimeo.com/455075353 or just the ID
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : url;
}

export default function VideoModal({ visible, onClose, vimeoId, title, subtitle, previewMode }: VideoModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(PREVIEW_LIMIT_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const id = getVimeoId(vimeoId);

  // Reset and start timer when modal opens in preview mode
  useEffect(() => {
    if (visible && previewMode) {
      setSecondsLeft(PREVIEW_LIMIT_SECONDS);
      setExpired(false);
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(PREVIEW_LIMIT_SECONDS);
      setExpired(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, previewMode]);

  const embedHtml = id ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://player.vimeo.com/video/${id}?autoplay=1&color=C9963C&title=0&byline=0&portrait=0&playsinline=1"
    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
    allowfullscreen
  ></iframe>
</body>
</html>` : '';

  React.useEffect(() => {
    if (visible && id) setLoading(true);
  }, [visible, id]);

  const showCountdown = previewMode && !expired && secondsLeft <= 15;

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
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
          {id && embedHtml && !expired ? (
            <WebView
              key={id}
              source={{ html: embedHtml, baseUrl: 'https://player.vimeo.com' }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
              javaScriptEnabled
              allowsInlineMediaPlayback
              originWhitelist={['*']}
            />
          ) : null}

          {/* Countdown warning — last 15 seconds */}
          {showCountdown && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.gold[500],
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold[500], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 14 }}>{secondsLeft}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 13 }}>Preview ending soon</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Enrol now for the introductory course towards certification</Text>
              </View>
            </Animated.View>
          )}

          {/* Expired overlay */}
          {expired && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
              }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Lock size={28} color="white" />
              </View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', color: 'white', fontSize: 22, textAlign: 'center', marginBottom: 10 }}>
                Preview Ended
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
                Your 1-minute preview has ended. Enroll in the full AFeeree Certification to watch all video content.
              </Text>
              <Pressable
                onPress={onClose}
                style={{ backgroundColor: colors.gold[500], borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 15 }}>Introductory Course — Enrol Now</Text>
              </Pressable>
              <Pressable onPress={onClose} style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Close</Text>
              </Pressable>
            </Animated.View>
          )}
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
            AFeeree Certification · Confidential
          </Text>
        </View>
      </View>
    </Modal>
  );
}
