import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md }]}>
      <Skeleton height={120} borderRadius={radius.md} />
      <View style={{ padding: spacing.lg }}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={14} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
