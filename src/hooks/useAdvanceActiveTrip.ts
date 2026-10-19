import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@/services/api';
import { appAlert } from '@/utils/appDialog';
import { formatCurrency } from '@/utils/format';
import type { ActiveTrip } from '@/types/partner';

type AdvanceOptions = {
  onTripUpdated?: (trip: ActiveTrip | null) => void;
  completedOrderNumber?: string;
  completedFee?: number;
};

export function useAdvanceActiveTrip() {
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);

  const invalidateTripQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
    await queryClient.invalidateQueries({ queryKey: ['active-run'] });
    await queryClient.invalidateQueries({ queryKey: ['earnings-summary'] });
    await queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  }, [queryClient]);

  const advance = useCallback(
    async (options?: AdvanceOptions) => {
      setAdvancing(true);
      try {
        const next = await deliveryService.advanceTrip();
        await invalidateTripQueries();
        options?.onTripUpdated?.(next);

        if (!next) {
          const orderLabel = options?.completedOrderNumber ?? 'Order';
          const fee = options?.completedFee;
          appAlert(
            'Delivery complete',
            fee != null
              ? `${orderLabel} delivered. You earned ${formatCurrency(fee)}.`
              : `${orderLabel} delivered successfully.`,
            [{ text: 'Back to home', onPress: () => router.replace('/(app)/(tabs)/home') }],
          );
          return null;
        }
        return next;
      } catch (e) {
        appAlert(
          'Could not update trip',
          e instanceof Error ? e.message : 'Check your connection and try again.',
        );
        return undefined;
      } finally {
        setAdvancing(false);
      }
    },
    [invalidateTripQueries],
  );

  return { advance, advancing, invalidateTripQueries };
}
