import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DeliveryRequest } from '@/types/partner';
import { formatCurrency } from '@/utils/format';
import { spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Props = {
  request: DeliveryRequest;
  distanceKm?: number;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
};

export function DeliveryRequestCard({
  request,
  distanceKm,
  selectable,
  selected,
  onToggleSelect,
  onAccept,
  onReject,
  loading,
}: Props) {
  const { colors, typography, fontFamily } = useTheme();

  return (
    <Card
      style={{
        marginBottom: spacing.md,
        borderColor: selected ? colors.primary : undefined,
        borderWidth: selected ? 2 : undefined,
      }}
    >
      {selectable ? (
        <Pressable onPress={onToggleSelect} style={styles.selectRow}>
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={22}
            color={selected ? colors.primary : colors.textMuted}
          />
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Select for batch</Text>
        </Pressable>
      ) : null}
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text, fontFamily: fontFamily.bold }]}>{request.orderNumber}</Text>
        <View style={styles.earnCol}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>You earn</Text>
          <Text style={[typography.h3, { color: colors.primary, fontFamily: fontFamily.bold }]}>
            {formatCurrency(request.deliveryFee)}
          </Text>
        </View>
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {request.itemCount} items · {formatCurrency(request.orderTotal)} order value
        {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km to pickup` : ''}
      </Text>
      <View style={[styles.row, { marginBottom: spacing.sm }]}>
        <Ionicons name="storefront-outline" size={16} color={colors.primary} />
        <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]} numberOfLines={2}>
          {request.pickupAddress}
        </Text>
      </View>
      <View style={[styles.row, { marginBottom: spacing.sm }]}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]} numberOfLines={2}>
          {request.customerAddress}
        </Text>
      </View>
      {!selectable ? (
        <View style={[styles.actions, { marginTop: spacing.md, gap: spacing.sm }]}>
          <Button title="Decline" onPress={onReject} variant="ghost" disabled={loading} style={styles.actionBtn} />
          <Button
            title={loading ? 'Accepting…' : 'Accept'}
            onPress={onAccept}
            disabled={loading}
            loading={loading}
            style={styles.actionBtn}
          />
        </View>
      ) : (
        <View style={[styles.actions, { marginTop: spacing.md, gap: spacing.sm }]}>
          <Button title="Decline" onPress={onReject} variant="ghost" disabled={loading} style={styles.actionBtn} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs, alignItems: 'flex-start' },
  earnCol: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', gap: spacing.sm },
  actions: { flexDirection: 'row' },
  actionBtn: { flex: 1 },
});
