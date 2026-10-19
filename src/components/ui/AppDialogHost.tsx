import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDialogStore, type DialogActionStyle, type DialogVariant } from '@/stores/dialogStore';
import { spacing, typography, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/theme';

type VariantConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  accent: string;
};

function getVariantConfig(colors: ThemeColors): Record<DialogVariant, VariantConfig> {
  return {
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
}

export function AppDialogHost() {
  const { colors, shadows } = useTheme();
  const variantConfig = getVariantConfig(colors);
  const visible = useDialogStore((state) => state.visible);
  const options = useDialogStore((state) => state.options);
  const hide = useDialogStore((state) => state.hide);

  if (!options) return null;

  const variant = options.variant ?? 'default';
  const config = variantConfig[variant];
  const actions = options.actions?.length ? options.actions : [{ text: 'OK', style: 'default' as const }];
  const stackedActions = actions.length > 2;

  function getActionStyles(style: DialogActionStyle | undefined, v: DialogVariant) {
    if (style === 'cancel') {
      return {
        container: {
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: { color: colors.textSecondary },
      };
    }
    if (style === 'destructive') {
      return {
        container: { backgroundColor: colors.danger },
        text: { color: colors.white },
      };
    }
    return {
      container: { backgroundColor: variantConfig[v].accent },
      text: { color: colors.white },
    };
  }

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              ...shadows.lg,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg, borderRadius: radius.full }]}>
            <Ionicons name={config.icon} size={30} color={config.iconColor} />
          </View>

          <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>
            {options.title}
          </Text>
          {!!options.message && (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              {options.message}
            </Text>
          )}

          <View
            style={[
              styles.actions,
              !options.message && { marginTop: spacing.sm },
              stackedActions && styles.actionsStacked,
            ]}
          >
            {actions.map((action, index) => {
              const actionStyles = getActionStyles(action.style, variant);
              return (
                <TouchableOpacity
                  key={`${action.text}-${index}`}
                  style={[
                    styles.actionBase,
                    { borderRadius: radius.md },
                    actionStyles.container,
                    !stackedActions && styles.actionFlex,
                  ]}
                  onPress={() => handleActionPress(action.onPress)}
                  activeOpacity={0.85}
                >
                  <Text style={[typography.button, actionStyles.text]}>{action.text}</Text>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionBase: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionFlex: {
    flex: 1,
  },
});
