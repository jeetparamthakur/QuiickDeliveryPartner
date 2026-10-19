import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ActiveDeliveryRun } from '@/types/partner';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/format';
import { spacing } from '@/theme';

type Props = {
  run: ActiveDeliveryRun;
};

export function RunStopsList({ run }: Props) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[styles.list, { borderColor: colors.border, borderRadius: radius.lg }]}>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        {run.stopsRemaining} stop{run.stopsRemaining === 1 ? '' : 's'} left · {run.orders.length} orders
      </Text>
      {run.stops.map((stop, index) => {
        const isCurrent = index === run.currentStopIndex && stop.status === 'current';
        const isDone = stop.status === 'done';
        const icon =
          stop.kind === 'pickup' ? 'storefront-outline' : 'location-outline';
        const stopEarnings = stop.orderIds
          .map((orderId) => run.orders.find((o) => o.orderId === orderId)?.deliveryFee ?? 0)
          .reduce((sum, fee) => sum + fee, 0);
        return (
          <View
            key={stop.stopId}
            style={[
              styles.row,
              {
                backgroundColor: isCurrent ? colors.primaryLight : colors.surface,
                borderColor: isCurrent ? colors.primary : colors.borderSubtle,
              },
            ]}
          >
            <Ionicons
              name={isDone ? 'checkmark-circle' : icon}
              size={18}
              color={isDone ? colors.success : isCurrent ? colors.primary : colors.textMuted}
            />
            <View style={styles.textCol}>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    color: colors.text,
                    fontWeight: isCurrent ? '600' : '400',
                  },
                ]}
                numberOfLines={2}
              >
                {stop.kind === 'pickup' ? 'Pickup' : 'Drop'} · {stop.orderNumbers.join(', ')}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {stop.address}
              </Text>
              {stopEarnings > 0 ? (
                <Text style={[typography.caption, { color: colors.primary, marginTop: 2 }]}>
                  You earn {formatCurrency(stopEarnings)}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  textCol: { flex: 1, gap: 2 },
});
