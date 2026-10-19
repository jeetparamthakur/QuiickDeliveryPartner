import type { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { deliveryService } from '@/services/api';
import { DELIVERY_REQUESTS_QUERY_KEY } from '@/hooks/useDeliveryRequestsQuery';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';

export async function acceptDeliveryRequest(
  requestId: string,
  queryClient: QueryClient
): Promise<void> {
  const profile = usePartnerStore.getState().profile;
  if (!profile) {
    throw new Error('Partner profile not loaded');
  }
  const trip = await deliveryService.acceptRequest(requestId, profile.id, profile.name);
  await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
  await queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  await queryClient.invalidateQueries({ queryKey: [DELIVERY_REQUESTS_QUERY_KEY] });
  router.push(`/(app)/trip/${trip.orderId}`);
}

export async function rejectDeliveryRequest(
  requestId: string,
  queryClient: QueryClient
): Promise<void> {
  await deliveryService.rejectRequest(requestId);
  await queryClient.invalidateQueries({ queryKey: [DELIVERY_REQUESTS_QUERY_KEY] });
}

export async function resolveAssignmentId(
  assignmentId?: string,
  subOrderId?: string
): Promise<string | null> {
  if (assignmentId) return assignmentId;
  if (!subOrderId) return null;

  const session = usePartnerSessionStore.getState();
  const latitude = session.latitude ?? 28.6139;
  const longitude = session.longitude ?? 77.209;
  const preferences = session.preferences;
  const requests = await deliveryService.getAvailableRequests(
    latitude,
    longitude,
    preferences
  );
  const match = requests.find((r) => r.orderId === subOrderId);
  return match?.id ?? null;
}
