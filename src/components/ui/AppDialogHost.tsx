import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDialogStore, type DialogActionStyle, type DialogVariant } from '@/stores/dialogStore';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type VariantConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  accent: string;
};

const variantConfig: Record<DialogVariant, VariantConfig> = {
  default: {
    icon: 'information-circle',
    iconColor: colors.primary,
    iconBg: colors.primaryLight,
    accent: colors.primary,
  },
  success: {
    icon: 'checkmark-circle',
    iconColor: colors.success,
    iconBg: colors.successLight,
    accent: colors.success,
  },
  error: {
    icon: 'close-circle',
    iconColor: colors.danger,
    iconBg: colors.dangerLight,
    accent: colors.danger,
  },
  warning: {
    icon: 'alert-circle',
    iconColor: colors.warning,
    iconBg: colors.warningLight,
    accent: colors.warning,
  },
  destructive: {
    icon: 'trash',
    iconColor: colors.danger,
    iconBg: colors.dangerLight,
    accent: colors.danger,
  },
};

function getActionStyles(style: DialogActionStyle | undefined, variant: DialogVariant) {
  if (style === 'cancel') {
    return {
      container: styles.actionCancel,
      text: styles.actionCancelText,
    };
  }
  if (style === 'destructive') {
    return {
      container: styles.actionDestructive,
      text: styles.actionPrimaryText,
    };
  }
  return {
    container: [styles.actionPrimary, { backgroundColor: variantConfig[variant].accent }],
    text: styles.actionPrimaryText,
  };
}

export function AppDialogHost() {
  const visible = useDialogStore((state) => state.visible);
  const options = useDialogStore((state) => state.options);
  const hide = useDialogStore((state) => state.hide);

  if (!options) return null;

  const variant = options.variant ?? 'default';
  const config = variantConfig[variant];
  const actions = options.actions?.length ? options.actions : [{ text: 'OK', style: 'default' as const }];
  const stackedActions = actions.length > 2;

  function handleActionPress(onPress?: () => void) {
    hide();
    onPress?.();
  }

  function handleBackdropPress() {
    if (options?.dismissOnBackdrop === false) return;
    hide();
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={hide}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon} size={30} color={config.iconColor} />
          </View>

          <Text style={styles.title}>{options.title}</Text>
          {!!options.message && <Text style={styles.message}>{options.message}</Text>}

          <View style={[styles.actions, !options.message && styles.actionsNoMessage, stackedActions && styles.actionsStacked]}>
            {actions.map((action, index) => {
              const actionStyles = getActionStyles(action.style, variant);
              return (
                <TouchableOpacity
                  key={`${action.text}-${index}`}
                  style={[styles.actionBase, actionStyles.container, !stackedActions && styles.actionFlex]}
                  onPress={() => handleActionPress(action.onPress)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.actionText, actionStyles.text]}>{action.text}</Text>
                </TouchableOpacity>
              );
            })}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionsNoMessage: {
    marginTop: spacing.sm,
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionBase: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionFlex: {
    flex: 1,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionDestructive: {
    backgroundColor: colors.danger,
  },
  actionCancel: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    ...typography.button,
  },
  actionPrimaryText: {
    color: colors.white,
  },
  actionCancelText: {
    color: colors.textSecondary,
  },
});
