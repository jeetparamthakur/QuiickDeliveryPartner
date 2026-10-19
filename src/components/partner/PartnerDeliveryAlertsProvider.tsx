import { useDeliveryRequestsQuery } from '@/hooks/useDeliveryRequestsQuery';
import {
  useDeliveryNotificationListeners,
  useDeliveryRequestNotifications,
  usePushNotifications,
} from '@/hooks/useNotifications';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { DeliveryRequestAlertModal } from '@/components/partner/DeliveryRequestAlertModal';

/** Polls delivery requests while online and drives push + local pickup alerts app-wide. */
export function PartnerDeliveryAlertsProvider() {
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const requestsQuery = useDeliveryRequestsQuery();

  usePushNotifications(isOnline);
  useDeliveryRequestNotifications(requestsQuery.data ?? [], isOnline);
  useDeliveryNotificationListeners(isOnline);

  return <DeliveryRequestAlertModal enabled={isOnline} />;
}
