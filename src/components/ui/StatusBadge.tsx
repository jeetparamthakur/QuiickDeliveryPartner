import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

type Props = {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
};

function variantColors(colors: ThemeColors): Record<BadgeVariant, { bg: string; text: string }> {
  return {
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    danger: { bg: colors.dangerLight, text: colors.danger },
    info: { bg: colors.infoLight, text: colors.info },
    neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
    primary: { bg: colors.primaryMuted, text: colors.primary },
  };
}

export function StatusBadge({ label, variant = 'neutral', dot }: Props) {
  const { colors, spacing, typography, radius, fontFamily } = useTheme();
  const c = variantColors(colors)[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: c.text, marginRight: spacing.xs }]} /> : null}
      <Text style={[typography.caption, { color: c.text, fontFamily: fontFamily.semiBold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
