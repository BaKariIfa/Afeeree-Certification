import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Eye, X } from 'lucide-react-native';
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
    logout().then(() => router.replace('/access-code'));
  };

  return (
    <View
      style={{
        backgroundColor: colors.primary[600],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Eye size={14} color={colors.gold[300]} />
        <Text
          style={{
            fontFamily: 'DMSans_600SemiBold',
            color: colors.gold[300],
            fontSize: 12,
            marginLeft: 6,
          }}
        >
          Preview Mode
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            marginLeft: 6,
          }}
        >
          — Limited access
        </Text>
      </View>
      <Pressable onPress={handleExit} style={{ padding: 4 }}>
        <Text
          style={{
            fontFamily: 'DMSans_600SemiBold',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
          }}
        >
          Exit Preview
        </Text>
      </Pressable>
    </View>
  );
}
