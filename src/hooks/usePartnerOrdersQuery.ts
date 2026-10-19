import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/services/api';
import type { PartnerOrdersTab } from '@/types/partner';

export const PARTNER_ORDERS_QUERY_KEY = 'partner-orders';

export function partnerOrdersQueryKey(tab: PartnerOrdersTab) {
  return [PARTNER_ORDERS_QUERY_KEY, tab] as const;
}

export function usePartnerOrdersQuery(tab: PartnerOrdersTab) {
  return useQuery({
    queryKey: partnerOrdersQueryKey(tab),
    queryFn: () => deliveryService.listMyOrders(tab),
  });
}
