import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DeliveryRequest } from '@/types/partner';
import { formatCurrency } from '@/utils/format';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type Props = {
  request: DeliveryRequest;
  distanceKm?: number;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
};

export function DeliveryRequestCard({
  request,
  distanceKm,
  onAccept,
  onReject,
  loading,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.order}>{request.orderNumber}</Text>
        <Text style={styles.fee}>{formatCurrency(request.deliveryFee)}</Text>
      </View>
      <Text style={styles.meta}>
        {request.itemCount} items · {formatCurrency(request.orderTotal)} order
        {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km to pickup` : ''}
      </Text>
      <View style={styles.row}>
        <Ionicons name="storefront-outline" size={16} color={colors.primary} />
        <Text style={styles.address} numberOfLines={2}>
          {request.pickupAddress}
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.address} numberOfLines={2}>
          {request.customerAddress}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.reject} onPress={onReject} disabled={loading}>
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accept} onPress={onAccept} disabled={loading}>
          <Text style={styles.acceptText}>{loading ? 'Accepting…' : 'Accept'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  order: { ...typography.h3, color: colors.text },
  fee: { ...typography.h3, color: colors.primary },
  meta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  address: { ...typography.bodySmall, color: colors.text, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  reject: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rejectText: { ...typography.button, color: colors.textSecondary },
  accept: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptText: { ...typography.button, color: colors.white },
});
