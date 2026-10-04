import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { deliveryService } from '@/services/api';
import { TRIP_STEP_LABELS, type TripStep } from '@/types';
import { formatCurrency } from '@/utils/format';
import { openMapsNavigation } from '@/utils/maps';
import { colors, radius, spacing, typography } from '@/theme';

const STEP_ACTIONS: Record<TripStep, { title: string; maps?: 'pickup' | 'drop' }> = {
  navigate_pickup: { title: 'Navigate to pickup', maps: 'pickup' },
  confirm_pickup: { title: 'Confirm pickup' },
  navigate_drop: { title: 'Navigate to customer', maps: 'drop' },
  confirm_delivery: { title: 'Confirm delivery' },
  completed: { title: 'Trip completed' },
};

export default function TripScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);

  const tripQuery = useQuery({
    queryKey: ['active-trip'],
    queryFn: () => deliveryService.getActiveTrip(),
  });

  const trip = tripQuery.data;
  const matchesOrder = !orderId || trip?.orderId === orderId;

  async function handlePrimaryAction() {
    if (!trip) return;
    const config = STEP_ACTIONS[trip.step];
    if (config.maps === 'pickup') {
      openMapsNavigation(trip.pickupLatitude, trip.pickupLongitude, trip.pickupAddress);
      return;
    }
    if (config.maps === 'drop') {
      openMapsNavigation(
        trip.customerLatitude,
        trip.customerLongitude,
        trip.customerAddress
      );
      return;
    }

    setAdvancing(true);
    try {
      const next = await deliveryService.advanceTrip();
      await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      await queryClient.invalidateQueries({ queryKey: ['earnings-summary'] });
      if (!next) {
        router.replace('/(app)/(tabs)/home');
      } else {
        tripQuery.refetch();
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (tripQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!trip || !matchesOrder) {
    return (
      <ScreenWrapper scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Button title="Back to home" onPress={() => router.replace('/(app)/(tabs)/home')} />
        </View>
      </ScreenWrapper>
    );
  }

  const action = STEP_ACTIONS[trip.step];
  const region = {
    latitude: trip.step.startsWith('navigate') || trip.step === 'confirm_pickup' ? trip.pickupLatitude : trip.customerLatitude,
    longitude:
      trip.step.startsWith('navigate') || trip.step === 'confirm_pickup'
        ? trip.pickupLongitude
        : trip.customerLongitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <ScreenWrapper scroll={false} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.order}>{trip.orderNumber}</Text>
          <Text style={styles.fee}>{formatCurrency(trip.deliveryFee)}</Text>
        </View>
        <Text style={styles.step}>{TRIP_STEP_LABELS[trip.step]}</Text>

        <MapView style={styles.map} region={region}>
          <Marker
            coordinate={{ latitude: trip.pickupLatitude, longitude: trip.pickupLongitude }}
            title="Pickup"
            pinColor={colors.primary}
          />
          <Marker
            coordinate={{ latitude: trip.customerLatitude, longitude: trip.customerLongitude }}
            title="Customer"
          />
        </MapView>

        <View style={styles.details}>
          <DetailRow icon="storefront-outline" text={trip.pickupAddress} />
          <DetailRow icon="location-outline" text={trip.customerAddress} />
          <Text style={styles.items}>{trip.itemCount} items in order</Text>
        </View>

        <Button
          title={action.title}
          onPress={handlePrimaryAction}
          loading={advancing}
          fullWidth
        />
        <Button
          title="Cancel trip view"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScreenWrapper>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { ...typography.h2, marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  order: { ...typography.h2 },
  fee: { ...typography.h2, color: colors.primary },
  step: { ...typography.body, color: colors.textSecondary },
  map: { flex: 1, borderRadius: radius.lg, minHeight: 220 },
  details: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  detailText: { ...typography.bodySmall, flex: 1, color: colors.text },
  items: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
