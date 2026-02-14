import React, { useEffect, useState } from 'react';
import { View, Dimensions, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  colors.gold[400],
  colors.gold[500],
  colors.primary[400],
  colors.primary[500],
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
];

interface ConfettiPieceProps {
  index: number;
  onComplete?: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index, onComplete }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const startX = Math.random() * SCREEN_WIDTH;
  const endX = startX + (Math.random() - 0.5) * 200;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 8;
  const delay = Math.random() * 300;
  const duration = 2000 + Math.random() * 1000;
  const rotations = 2 + Math.random() * 4;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX - startX, {
        duration,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotations * 360, {
        duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }, (finished) => {
        if (finished && index === 0 && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: duration - 200 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
};

interface CelebrationProps {
  visible: boolean;
  onComplete?: () => void;
  pieceCount?: number;
}

export const Celebration: React.FC<CelebrationProps> = ({
  visible,
  onComplete,
  pieceCount = 50,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  const handleComplete = () => {
    setShowConfetti(false);
    onComplete?.();
  };

  if (!showConfetti) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: pieceCount }).map((_, index) => (
        <ConfettiPiece
          key={index}
          index={index}
          onComplete={index === 0 ? handleComplete : undefined}
        />
      ))}
    </View>
  );
};

export default Celebration;
