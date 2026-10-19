import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { TripStepIndicator } from '@/components/trip/TripStepIndicator';
import { TripActionFooter } from '@/components/trip/TripActionFooter';
import { RunStopsList } from '@/components/trip/RunStopsList';
import { TRIP_STEP_UI } from '@/constants/tripSteps';
import { useAdvanceActiveTrip } from '@/hooks/useAdvanceActiveTrip';
import { deliveryService } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import type { ActiveTrip } from '@/types/partner';
import { formatCurrency } from '@/utils/format';
import { openMapsNavigation, openMapsRoute } from '@/utils/maps';
import { appConfirm } from '@/utils/appDialog';

export default function TripScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors, radius, spacing, typography } = useTheme();
  const { advance, advancing } = useAdvanceActiveTrip();

  const runQuery = useQuery({
    queryKey: ['active-run'],
    queryFn: () => deliveryService.getActiveRun(),
  });

  const tripQuery = useQuery({
    queryKey: ['active-trip'],
    queryFn: () => deliveryService.getActiveTrip(),
  });

  useFocusEffect(
    useCallback(() => {
      void runQuery.refetch();
      void tripQuery.refetch();
    }, [runQuery.refetch, tripQuery.refetch]),
  );

  const run = runQuery.data;
  const trip = tripQuery.data;
  const step = run?.microStep ?? trip?.step;
  const matchesOrder =
    !orderId || trip?.orderId === orderId || run?.orders.some((o) => o.orderId === orderId);

  const currentStop = run?.currentStop;
  const isMultiOrder = (run?.orders.length ?? 0) > 1;

  const mapRegion = useMemo(() => {
    if (currentStop) {
      return {
        latitude: currentStop.latitude,
        longitude: currentStop.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (!trip) return null;
    return {
      latitude:
        trip.step.startsWith('navigate') || trip.step === 'confirm_pickup'
          ? trip.pickupLatitude
          : trip.customerLatitude,
      longitude:
        trip.step.startsWith('navigate') || trip.step === 'confirm_pickup'
          ? trip.pickupLongitude
          : trip.customerLongitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [currentStop, trip]);

  function openMapsForStep(activeTrip: ActiveTrip) {
    if (currentStop) {
      openMapsNavigation(currentStop.latitude, currentStop.longitude, currentStop.address);
      return;
    }
    const mapsTarget = TRIP_STEP_UI[activeTrip.step].mapsTarget;
    if (mapsTarget === 'pickup') {
      openMapsNavigation(
        activeTrip.pickupLatitude,
        activeTrip.pickupLongitude,
        activeTrip.pickupAddress,
      );
      return;
    }
    if (mapsTarget === 'drop') {
      openMapsNavigation(
        activeTrip.customerLatitude,
        activeTrip.customerLongitude,
        activeTrip.customerAddress,
      );
    }
  }

  function openFullRoute() {
    if (!run) return;
    const remaining = run.stops
      .filter((s) => s.status !== 'done')
      .map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
    openMapsRoute(remaining);
  }

  function runAdvance(activeTrip: ActiveTrip) {
    if (!step) return;
    const confirm = TRIP_STEP_UI[step].confirmBeforeAdvance;
    const orderLabel = currentStop?.orderNumbers.join(', ') ?? activeTrip.orderNumber;
    const completedFee = run?.totalDeliveryFee ?? activeTrip.deliveryFee;

    const runAdvanceAction = () => {
      void advance({
        completedOrderNumber: isMultiOrder ? `${run?.orders.length} orders` : orderLabel,
        completedFee: isMultiOrder ? completedFee : activeTrip.deliveryFee,
        onTripUpdated: () => {
          tripQuery.refetch();
          runQuery.refetch();
        },
      });
    };

    if (confirm) {
      appConfirm(confirm.title, confirm.message, {
        confirmText: confirm.confirmText,
        onConfirm: runAdvanceAction,
      });
      return;
    }
    runAdvanceAction();
  }

  const primaryLabel = useMemo(() => {
    if (!step) return undefined;
    const base = TRIP_STEP_UI[step].primaryAdvanceLabel;
    const orderLabel = currentStop?.orderNumbers[0];
    if (!orderLabel) return base;
    if (step === 'confirm_pickup') return `Order picked up · ${orderLabel}`;
    if (step === 'confirm_delivery') return `Mark delivered · ${orderLabel}`;
    return base;
  }, [step, currentStop]);

  if (tripQuery.isLoading || runQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!trip || !matchesOrder || !step) {
    return (
      <ScreenWrapper scroll={false}>
        <View style={styles.centered}>
          <Text style={[typography.h2, { marginBottom: spacing.lg }]}>No active trip</Text>
          <Button title="Back to home" onPress={() => router.replace('/(app)/(tabs)/home')} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.container, { padding: spacing.lg, gap: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={typography.h2}>
              {isMultiOrder ? `${run?.orders.length} orders` : trip.orderNumber}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {isMultiOrder ? 'Total earn' : 'You earn'}
            </Text>
          </View>
          <Text style={[typography.h2, { color: colors.primary }]}>
            {formatCurrency(run?.totalDeliveryFee ?? trip.deliveryFee)}
          </Text>
        </View>

        <TripStepIndicator step={step} />

        {run && isMultiOrder ? <RunStopsList run={run} /> : null}

        {mapRegion ? (
          <MapView style={[styles.map, { borderRadius: radius.lg }]} region={mapRegion}>
            {run
              ? run.stops.map((stop) => (
                  <Marker
                    key={stop.stopId}
                    coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                    title={stop.orderNumbers.join(', ')}
                    pinColor={
                      stop.status === 'current'
                        ? colors.primary
                        : stop.status === 'done'
                          ? colors.success
                          : colors.textMuted
                    }
                  />
                ))
              : (
                <>
                  <Marker
                    coordinate={{ latitude: trip.pickupLatitude, longitude: trip.pickupLongitude }}
                    title="Pickup"
                    pinColor={colors.primary}
                  />
                  <Marker
                    coordinate={{
                      latitude: trip.customerLatitude,
                      longitude: trip.customerLongitude,
                    }}
                    title="Customer"
                  />
                </>
              )}
          </MapView>
        ) : null}

        <View
          style={[
            styles.details,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              borderColor: colors.border,
            },
          ]}
        >
          {currentStop ? (
            <DetailRow icon="navigate-outline" text={currentStop.address} color={colors.primary} />
          ) : (
            <>
              <DetailRow icon="storefront-outline" text={trip.pickupAddress} color={colors.primary} />
              <DetailRow icon="location-outline" text={trip.customerAddress} color={colors.primary} />
            </>
          )}
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {trip.itemCount} items at this stop
          </Text>
        </View>

        <TripActionFooter
          step={step}
          loading={advancing}
          primaryAdvanceLabel={primaryLabel}
          onAdvance={() => runAdvance(trip)}
          onOpenMaps={TRIP_STEP_UI[step].mapsTarget ? () => openMapsForStep(trip) : undefined}
          onViewFullRoute={run && run.stopsRemaining > 1 ? openFullRoute : undefined}
          onDismiss={() => router.back()}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

function DetailRow({
  icon,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  const { typography, spacing } = useTheme();
  return (
    <View style={[styles.detailRow, { gap: spacing.sm }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[typography.bodySmall, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { flex: 1, gap: 2 },
  map: { flex: 1, minHeight: 220 },
  details: { gap: 8, borderWidth: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
