import { Stack } from 'expo-router';
import { WorkplaceSelectionGate } from '@/components/workplace/WorkplaceSelectionGate';
import { PartnerDeliveryAlertsProvider } from '@/components/partner/PartnerDeliveryAlertsProvider';
import { useWorkplaceUiStore } from '@/stores/workplaceUiStore';

export default function AppLayout() {
  const manualOpenSignal = useWorkplaceUiStore((s) => s.openRequestId);

  return (
    <WorkplaceSelectionGate manualOpenSignal={manualOpenSignal}>
      <PartnerDeliveryAlertsProvider />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/[orderId]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="orders/[orderId]" />
        <Stack.Screen name="support" />
      </Stack>
    </WorkplaceSelectionGate>
  );
}
