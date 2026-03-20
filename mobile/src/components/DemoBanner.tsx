import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Eye, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';
import { useUserStore } from '@/lib/userStore';

export default function DemoBanner() {
  const isDemoMode = useUserStore(s => s.isDemoMode);
  const logout = useUserStore(s => s.logout);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!isDemoMode) return null;

  const handleExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate first before logout resets state and unmounts this component
    router.replace('/landing');
    logout();
  };

  return (
    <View style={{ backgroundColor: colors.primary[800], paddingTop: insets.top }}>
      <Pressable
        onPress={handleExit}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Eye size={18} color={colors.gold[300]} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.gold[300], fontSize: 14 }}>
              Preview Mode
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 }}>
              Limited access — tap to exit
            </Text>
          </View>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.gold[500],
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 24,
          gap: 6,
        }}>
          <LogOut size={15} color="white" />
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: 'white', fontSize: 14 }}>
            Exit
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
