import { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
};

const otpKeyboardProps = Platform.select({
  ios: {
    keyboardType: 'number-pad' as const,
    returnKeyType: 'done' as const,
  },
  android: {
    keyboardType: 'number-pad' as const,
    showSoftInputOnFocus: true,
    returnKeyType: 'done' as const,
  },
  web: {
    keyboardType: 'numeric' as const,
    inputMode: 'numeric' as const,
  },
  default: {
    keyboardType: 'number-pad' as const,
  },
});

export function OTPInput({ value, onChange, length = 6, autoFocus = true }: Props) {
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    onChange(text.replace(/\D/g, '').slice(0, length));
  }

  return (
    <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>
      <View style={styles.boxRow} pointerEvents="none">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] ?? '';
          const isFocused = index === value.length;
          return (
            <View
              key={index}
              style={[styles.box, isFocused && styles.boxFocused, digit !== '' && styles.boxFilled]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        autoCorrect={false}
        {...otpKeyboardProps}
      />
    </Pressable>
  );
}

const BOX_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    maxWidth: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.primary,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  digit: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 16,
  },
});
