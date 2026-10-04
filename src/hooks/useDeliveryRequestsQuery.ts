import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/services/api';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';

export const DELIVERY_REQUESTS_QUERY_KEY = 'delivery-requests';

export function deliveryRequestsQueryKey(
  latitude: number,
  longitude: number,
  preferences: ReturnType<typeof usePartnerSessionStore.getState>['preferences'],
  isOnline: boolean
) {
  return [DELIVERY_REQUESTS_QUERY_KEY, latitude, longitude, preferences, isOnline] as const;
}

export function useDeliveryRequestsQuery() {
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const latitude = usePartnerSessionStore((s) => s.latitude) ?? 28.6139;
  const longitude = usePartnerSessionStore((s) => s.longitude) ?? 77.209;
  const preferences = usePartnerSessionStore((s) => s.preferences);

  return useQuery({
    queryKey: deliveryRequestsQueryKey(latitude, longitude, preferences, isOnline),
    queryFn: () => deliveryService.getAvailableRequests(latitude, longitude, preferences),
    enabled: isOnline,
    refetchInterval: isOnline ? 5000 : false,
  });
}
