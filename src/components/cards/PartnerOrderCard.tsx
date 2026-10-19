import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PartnerOrder } from '@/types/partner';
import { partnerOrderStatusLabel } from '@/types/partner';
import { formatCurrency } from '@/utils/format';
import { spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PressableScale } from '@/components/ui/PressableScale';

type Props = {
  order: PartnerOrder;
  onPress: () => void;
};

export function PartnerOrderCard({ order, onPress }: Props) {
  const { colors, typography, fontFamily } = useTheme();
  const isDelivered = order.status === 'delivered';
  const statusLabel = partnerOrderStatusLabel(order);

  return (
    <PressableScale onPress={onPress} haptic="selection">
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[typography.h3, { color: colors.text, fontFamily: fontFamily.bold }]}>
              {order.orderNumber}
            </Text>
            <StatusBadge
              label={statusLabel}
              variant={isDelivered ? 'success' : 'primary'}
              dot={!isDelivered}
            />
          </View>
          <View style={styles.headerRight}>
            <View style={styles.earnCol}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>You earn</Text>
              <Text style={[typography.h3, { color: colors.primary, fontFamily: fontFamily.bold }]}>
                {formatCurrency(order.deliveryFee)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          {order.itemCount} items · {formatCurrency(order.orderTotal)} order
        </Text>
        <View style={[styles.row, { marginBottom: spacing.sm }]}>
          <Ionicons name="storefront-outline" size={16} color={colors.primary} />
          <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {order.pickupAddress}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {order.customerAddress}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerLeft: { flex: 1, gap: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  earnCol: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
