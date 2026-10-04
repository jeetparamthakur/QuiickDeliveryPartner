import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export type BottomSheetOption = {
  id: string;
  label: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: BottomSheetOption[];
  onClose: () => void;
  onSelect: (option: BottomSheetOption) => void;
};

export function BottomSheetPanel({ visible, title, subtitle, options, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, index === options.length - 1 && styles.optionLast]}
                onPress={() => onSelect(option)}
                activeOpacity={0.85}
              >
                {option.icon && (
                  <View style={styles.optionIcon}>
                    <Ionicons name={option.icon} size={18} color={colors.primary} />
                  </View>
                )}
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {!!option.subtitle && <Text style={styles.optionSubtitle}>{option.subtitle}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: { ...typography.bodyMedium, color: colors.text },
  optionSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
