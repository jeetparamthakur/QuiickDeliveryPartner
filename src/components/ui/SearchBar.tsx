import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from './PressableScale';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...', onFilter }: Props) {
  const { colors, radius, spacing, typography, shadows } = useTheme();

  return (
    <View
      style={[
        styles.container,
        shadows.sm,
        {
          backgroundColor: colors.searchFill,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
          marginBottom: spacing.lg,
          gap: spacing.sm,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        style={[typography.body, { flex: 1, color: colors.text, paddingVertical: spacing.xs }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      {onFilter ? (
        <PressableScale onPress={onFilter} haptic="selection">
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
