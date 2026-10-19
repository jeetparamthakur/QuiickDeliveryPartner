import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'network' | 'server' | 'generic';
};

const errorConfig = {
  network: { icon: 'cloud-offline-outline' as const, title: 'No Internet', message: 'Please check your connection and try again.' },
  server: { icon: 'server-outline' as const, title: 'Server Error', message: 'Something went wrong on our end. Please try again.' },
  generic: { icon: 'alert-circle-outline' as const, title: 'Error', message: 'Something went wrong. Please try again.' },
};

export function ErrorState({ title, message, onRetry, type = 'generic' }: Props) {
  const { colors, spacing, typography } = useTheme();
  const config = errorConfig[type];

  return (
    <View style={[styles.container, { padding: spacing.xxxl }]}>
      <Ionicons name={config.icon} size={48} color={colors.error} />
      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
        {title ?? config.title}
      </Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
        {message ?? config.message}
      </Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} variant="secondary" style={{ marginTop: spacing.xl }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
