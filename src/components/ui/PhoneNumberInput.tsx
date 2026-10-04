import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

const PHONE_INPUT_HEIGHT = 52;

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  error?: boolean;
  placeholder?: string;
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
};

const mobileKeyboardProps = Platform.select({
  ios: {
    keyboardType: 'phone-pad' as const,
    textContentType: 'telephoneNumber' as const,
    returnKeyType: 'done' as const,
  },
  android: {
    keyboardType: 'phone-pad' as const,
    showSoftInputOnFocus: true,
    returnKeyType: 'done' as const,
  },
  web: {
    keyboardType: 'numeric' as const,
    inputMode: 'tel' as const,
  },
  default: {
    keyboardType: 'phone-pad' as const,
  },
});

export function PhoneNumberInput({
  value,
  onChangeText,
  error = false,
  placeholder = '9876543210',
  onFocus,
  onBlur,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  function handleChange(text: string) {
    onChangeText(text.replace(/\D/g, '').slice(0, 10));
  }

  return (
    <Pressable
      style={[styles.row, focused && styles.rowFocused, error && styles.rowError]}
      onPress={() => inputRef.current?.focus()}
    >
      <View style={styles.countryCode}>
        <Text style={styles.flag}>🇮🇳</Text>
        <Text style={styles.countryCodeText}>+91</Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={10}
        editable
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden={false}
        style={styles.input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...mobileKeyboardProps}
      />
      {value.length === 10 && (
        <View style={styles.validIcon}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: PHONE_INPUT_HEIGHT,
    marginBottom: spacing.sm,
  },
  rowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rowError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: PHONE_INPUT_HEIGHT,
  },
  flag: { fontSize: 18 },
  countryCodeText: { fontSize: 16, fontWeight: '600', color: colors.text },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    height: PHONE_INPUT_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'android'
      ? { textAlignVertical: 'center', includeFontPadding: false }
      : {}),
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', minWidth: 120 } as unknown as TextStyle)
      : {}),
  },
  validIcon: { paddingRight: spacing.md },
});
