import type { ComponentProps } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

export type OptionIconSpec = {
  set: 'ionicons' | 'material';
  name: string;
};

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  icon: OptionIconSpec;
};

type Props<T extends string> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

function OptionIcon({
  icon,
  size,
  color,
}: {
  icon: OptionIconSpec;
  size: number;
  color: string;
}) {
  if (icon.set === 'material') {
    return (
      <MaterialCommunityIcons
        name={icon.name as ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={size}
        color={color}
      />
    );
  }
  return (
    <Ionicons name={icon.name as ComponentProps<typeof Ionicons>['name']} size={size} color={color} />
  );
}

export function OptionSelectGrid<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const selected = option.value === value;
        const iconColor = selected ? colors.primary : colors.textSecondary;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <OptionIcon icon={option.icon} size={28} color={iconColor} />
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  option: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
