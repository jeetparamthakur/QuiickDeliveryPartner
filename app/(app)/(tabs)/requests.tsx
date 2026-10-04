import { useState } from 'react';
import { Text, StyleSheet, RefreshControl, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { DeliveryRequestCard } from '@/components/cards/DeliveryRequestCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { deliveryService } from '@/services/api';
import { useDeliveryRequestsQuery } from '@/hooks/useDeliveryRequestsQuery';
import { getDistanceKm } from '@/utils/geo';
import { spacing, typography } from '@/theme';

export default function RequestsScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const latitude = usePartnerSessionStore((s) => s.latitude) ?? 28.6139;
  const longitude = usePartnerSessionStore((s) => s.longitude) ?? 77.209;
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const requestsQuery = useDeliveryRequestsQuery();

  async function handleAccept(requestId: string) {
    if (!profile) return;
    setAcceptingId(requestId);
    try {
      const trip = await deliveryService.acceptRequest(requestId, profile.id, profile.name);
      await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      router.push(`/(app)/trip/${trip.orderId}`);
    } catch (e) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again');
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleReject(requestId: string) {
    try {
      await deliveryService.rejectRequest(requestId);
      requestsQuery.refetch();
    } catch {
      Alert.alert('Could not decline request');
    }
  }

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={requestsQuery.isRefetching} onRefresh={() => requestsQuery.refetch()} />
        }
      >
        <Text style={styles.title}>Delivery requests</Text>
        {!isOnline ? (
          <EmptyState
            icon="moon-outline"
            title="You are offline"
            message="Go online from Home to see nearby delivery requests."
          />
        ) : requestsQuery.data?.length ? (
          requestsQuery.data.map((request) => (
            <DeliveryRequestCard
              key={request.id}
              request={request}
              distanceKm={getDistanceKm(
                latitude,
                longitude,
                request.pickupLatitude,
                request.pickupLongitude
              )}
              onAccept={() => handleAccept(request.id)}
              onReject={() => handleReject(request.id)}
              loading={acceptingId === request.id}
            />
          ))
        ) : (
          <EmptyState
            icon="search-outline"
            title="No requests right now"
            message="Orders appear here when stores mark them ready for pickup and you are online."
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  title: { ...typography.h1, marginBottom: spacing.lg },
});
