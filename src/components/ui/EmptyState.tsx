import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'folder-open-outline', title, message, actionLabel, onAction }: Props) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxxl }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.full,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Ionicons name={icon} size={48} color={colors.textMuted} />
      </View>
      <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>{title}</Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.xl }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
