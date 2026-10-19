import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from './PressableScale';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, radius, spacing, typography, fontFamily, shadows } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.lg,
        padding: spacing.xs,
        gap: spacing.xs,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            haptic="selection"
            style={[
              {
                flex: 1,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
              },
              isSelected
                ? {
                    backgroundColor: colors.surface,
                    ...shadows.sm,
                  }
                : null,
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                {
                  color: isSelected ? colors.primary : colors.textSecondary,
                  textAlign: 'center',
                  fontFamily: isSelected ? fontFamily.semiBold : fontFamily.medium,
                },
              ]}
              numberOfLines={2}
            >
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({});
