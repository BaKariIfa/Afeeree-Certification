import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Eye, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';
import { useUserStore } from '@/lib/userStore';

export default function DemoBanner() {
  const isDemoMode = useUserStore(s => s.isDemoMode);
  const logout = useUserStore(s => s.logout);
  const router = useRouter();

  if (!isDemoMode) return null;

  const handleExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate first before state resets (which would unmount this component)
    router.replace('/landing');
    logout();
  };

  return (
    <Pressable
      onPress={handleExit}
      style={{
        backgroundColor: colors.primary[700],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Eye size={16} color={colors.gold[300]} />
        <View style={{ marginLeft: 10 }}>
          <Text
            style={{
              fontFamily: 'DMSans_600SemiBold',
              color: colors.gold[300],
              fontSize: 13,
            }}
          >
            Preview Mode
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              marginTop: 1,
            }}
          >
            Tap to exit and enroll
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
        }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_600SemiBold',
            color: 'white',
            fontSize: 13,
          }}
        >
          Exit Preview
        </Text>
        <ArrowRight size={14} color="white" style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  );
}
