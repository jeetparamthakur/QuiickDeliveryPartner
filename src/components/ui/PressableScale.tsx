import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';

type HapticKind = 'light' | 'medium' | 'selection' | 'none';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: HapticKind;
  scaleTo?: number;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  onPress,
  disabled = false,
  style,
  haptic = 'light',
  scaleTo,
  accessibilityRole = 'button',
  accessibilityLabel,
}: Props) {
  const { motion } = useTheme();
  const scale = useSharedValue(1);
  const targetScale = scaleTo ?? motion.pressScale;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fireHaptic = async () => {
    if (haptic === 'none') return;
    if (haptic === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (haptic === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <AnimatedPressable
      onPress={() => {
        void fireHaptic();
        onPress?.();
      }}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(targetScale, motion.spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.springSoft);
      }}
      disabled={disabled || !onPress}
      style={[animStyle, style, disabled ? { opacity: 0.5 } : null]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {children}
    </AnimatedPressable>
  );
}
