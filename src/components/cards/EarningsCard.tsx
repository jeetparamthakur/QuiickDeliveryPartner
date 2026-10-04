import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, metricAccents, radius, spacing, typography, shadows } from '@/theme';
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
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;
  const accent = metricAccents[metricKey] ?? metricAccents.default;

  if (variant === 'featured') {
    return (
      <LinearGradient colors={[...gradients.primary]} style={styles.featuredCard}>
        <View style={styles.featuredIconWrap}>
          <Ionicons name={icon} size={22} color={colors.white} />
        </View>
        <Text style={styles.featuredValue}>{displayValue}</Text>
        <Text style={styles.featuredLabel}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
        <Ionicons name={icon} size={20} color={accent.icon} />
      </View>
      <Text style={styles.value}>{displayValue}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  featuredCard: {
    width: 180,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featuredIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { ...typography.h2, color: colors.text },
  featuredValue: { ...typography.h1, color: colors.white, fontSize: 24 },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  featuredLabel: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
});
