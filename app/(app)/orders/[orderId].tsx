import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { deliveryService } from '@/services/api';
import { partnerOrderStatusLabel } from '@/types/partner';
import { formatCurrency } from '@/utils/format';
import { colors, spacing, typography } from '@/theme';

export default function DeliveredOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const ordersQuery = useQuery({
    queryKey: ['partner-orders', 'delivered'],
    queryFn: () => deliveryService.listMyOrders('delivered'),
  });

  const order = ordersQuery.data?.find((o) => o.orderId === orderId);

  if (ordersQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <ScreenWrapper scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Button title="Back to orders" onPress={() => router.back()} />
        </View>
      </ScreenWrapper>
    );
  }

  const deliveredAt = order.completedAt
    ? new Date(order.completedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <StatusBadge label={partnerOrderStatusLabel(order)} variant="success" />
        </View>
        {deliveredAt ? (
          <Text style={styles.meta}>Delivered {deliveredAt}</Text>
        ) : null}

        <Card style={styles.feeCard}>
          <Text style={styles.feeLabel}>You earned</Text>
          <Text style={styles.feeValue}>{formatCurrency(order.deliveryFee)}</Text>
          <Text style={styles.meta}>
            {order.itemCount} items · {formatCurrency(order.orderTotal)} order value
          </Text>
        </Card>

        <Card>
          <DetailRow icon="storefront-outline" label="Pickup" text={order.pickupAddress} />
          <DetailRow icon="location-outline" label="Drop" text={order.customerAddress} />
        </Card>

        <Button title="Back to orders" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}

function DetailRow({
  icon,
  label,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  text: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailBody}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyTitle: { ...typography.h3, marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  orderNumber: { ...typography.h1, flex: 1 },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  feeCard: { gap: spacing.xs },
  feeLabel: { ...typography.caption, color: colors.textSecondary },
  feeValue: { ...typography.h2, color: colors.primary },
  detailRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  detailText: { flex: 1 },
  detailLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  detailBody: { ...typography.body },
});
