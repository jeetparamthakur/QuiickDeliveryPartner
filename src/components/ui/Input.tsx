import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  noMargin?: boolean;
};

export function Input({ label, error, hint, style, containerStyle, noMargin, ...props }: Props) {
  return (
    <View style={[styles.container, noMargin && styles.noMargin, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  noMargin: { marginBottom: 0 },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
