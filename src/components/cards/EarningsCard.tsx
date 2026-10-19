import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { metricAccents, spacing, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/format';

type MetricKey = keyof typeof metricAccents;

type Props = {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  isCurrency?: boolean;
  variant?: 'default' | 'featured';
  metricKey?: MetricKey;
};

export function EarningsCard({
  label,
  value,
  icon = 'wallet-outline',
  isCurrency,
  variant = 'default',
  metricKey = 'default',
}: Props) {
  const { colors, typography, shadows, fontFamily } = useTheme();
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;
  const accent = metricAccents[metricKey] ?? metricAccents.default;

  if (variant === 'featured') {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            flex: 1,
            borderRadius: radius.xl,
            padding: spacing.lg,
            ...shadows.md,
          },
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <Ionicons name={icon} size={22} color={colors.white} />
        </View>
        <Text style={{ ...typography.h1, fontSize: 24, color: colors.white, fontFamily: fontFamily.bold }}>
          {displayValue}
        </Text>
        <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.88)', marginTop: spacing.xs }}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        {
          width: 160,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginRight: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
        },
        shadows.sm,
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: accent.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={20} color={accent.icon} />
      </View>
      <Text style={{ ...typography.h2, color: colors.text, fontFamily: fontFamily.bold }}>{displayValue}</Text>
      <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>{label}</Text>
    </View>
  );
}
