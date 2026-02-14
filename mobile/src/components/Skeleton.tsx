import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  ...props
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.neutral[200],
        },
        animatedStyle,
        style,
      ]}
      {...props}
    />
  );
};

// Pre-built skeleton layouts
export const ModuleCardSkeleton: React.FC = () => (
  <View
    className="mb-4 rounded-2xl overflow-hidden flex-row"
    style={{ backgroundColor: 'white', height: 160 }}
  >
    <Skeleton width={110} height={160} borderRadius={0} />
    <View className="flex-1 p-3 justify-between">
      <View>
        <Skeleton width={80} height={20} borderRadius={12} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="70%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View>
        <Skeleton width="50%" height={10} borderRadius={4} />
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>
    </View>
  </View>
);

export const AssignmentCardSkeleton: React.FC = () => (
  <View
    className="mb-3 p-4 rounded-xl flex-row items-center"
    style={{ backgroundColor: 'white' }}
  >
    <Skeleton width={48} height={48} borderRadius={12} />
    <View className="flex-1 ml-4">
      <Skeleton width="70%" height={16} borderRadius={4} />
      <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
  </View>
);

export const ProfileStatsSkeleton: React.FC = () => (
  <View className="flex-row justify-around p-5">
    {[1, 2, 3].map((i) => (
      <View key={i} className="items-center">
        <Skeleton width={48} height={48} borderRadius={24} />
        <Skeleton width={30} height={24} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    ))}
  </View>
);

export default Skeleton;
