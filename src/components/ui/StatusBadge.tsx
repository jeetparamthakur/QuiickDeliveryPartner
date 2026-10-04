import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

type Props = {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.infoLight, text: colors.info },
  neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  primary: { bg: colors.primaryMuted, text: colors.primary },
};

export function StatusBadge({ label, variant = 'neutral', dot }: Props) {
  const c = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.text }]} />}
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xs },
  text: { ...typography.caption, fontWeight: '600' },
});
