import { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  noMargin?: boolean;
};

export function Input({ label, error, hint, style, containerStyle, noMargin, ...props }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, noMargin && styles.noMargin, { marginBottom: noMargin ? 0 : spacing.lg }, containerStyle]}>
      {label ? <Text style={[typography.label, { color: colors.text, marginBottom: spacing.sm }]}>{label}</Text> : null}
      <TextInput
        style={[
          typography.body,
          {
            backgroundColor: colors.searchFill,
            borderWidth: 1,
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>
      ) : null}
      {hint && !error ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  noMargin: {},
});
