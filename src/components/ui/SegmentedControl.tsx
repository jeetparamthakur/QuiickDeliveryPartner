import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

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
  const useGrid = options.length >= 4;

  return (
    <View style={[styles.container, useGrid && styles.containerGrid]}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.tab,
              useGrid ? styles.tabGrid : styles.tabRow,
              isSelected && styles.tabSelected,
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, isSelected && styles.tabTextSelected]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  containerGrid: {
    flexWrap: 'wrap',
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
  },
  tabRow: {
    flex: 1,
  },
  tabGrid: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '50%',
  },
  tabSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  tabTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
