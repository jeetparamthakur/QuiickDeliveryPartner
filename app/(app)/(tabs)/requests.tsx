import { useMemo, useState } from 'react';
import { Text, StyleSheet, RefreshControl, ScrollView, Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { DeliveryRequestCard } from '@/components/cards/DeliveryRequestCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { deliveryService } from '@/services/api';
import { useDeliveryRequestsQuery } from '@/hooks/useDeliveryRequestsQuery';
import { getDistanceKm } from '@/utils/geo';
import { MAX_RUN_ORDERS } from '@/utils/deliveryRun';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export default function RequestsScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const latitude = usePartnerSessionStore((s) => s.latitude) ?? 28.6139;
  const longitude = usePartnerSessionStore((s) => s.longitude) ?? 77.209;
  const [accepting, setAccepting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const requestsQuery = useDeliveryRequestsQuery();

  const selectedCount = selectedIds.length;

  const toggleSelect = (requestId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(requestId)) {
        return prev.filter((id) => id !== requestId);
      }
      if (prev.length >= MAX_RUN_ORDERS) {
        Alert.alert('Limit reached', `You can select up to ${MAX_RUN_ORDERS} orders at once.`);
        return prev;
      }
      return [...prev, requestId];
    });
  };

  async function handleAcceptBatch() {
    if (!profile || !selectedIds.length) return;
    setAccepting(true);
    try {
      const run = await deliveryService.acceptRequestBatch(
        selectedIds,
        profile.id,
        profile.name,
        latitude,
        longitude,
      );
      setSelectedIds([]);
      setSelectionMode(false);
      await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      await queryClient.invalidateQueries({ queryKey: ['active-run'] });
      await queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['delivery-requests'] });
      const firstOrderId = run.orders[0]?.orderId;
      if (firstOrderId) {
        router.push(`/(app)/trip/${firstOrderId}`);
      }
    } catch (e) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again');
    } finally {
      setAccepting(false);
    }
  }

  async function handleAcceptSingle(requestId: string) {
    if (!profile) return;
    setAccepting(true);
    try {
      const trip = await deliveryService.acceptRequest(requestId, profile.id, profile.name);
      await queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      await queryClient.invalidateQueries({ queryKey: ['active-run'] });
      await queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['delivery-requests'] });
      router.push(`/(app)/trip/${trip.orderId}`);
    } catch (e) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again');
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject(requestId: string) {
    try {
      await deliveryService.rejectRequest(requestId);
      setSelectedIds((prev) => prev.filter((id) => id !== requestId));
      requestsQuery.refetch();
    } catch {
      Alert.alert('Could not decline request');
    }
  }

  const headerActionLabel = useMemo(() => {
    if (!selectionMode) return 'Select multiple';
    if (!selectedCount) return 'Cancel';
    return 'Clear';
  }, [selectionMode, selectedCount]);

  function onHeaderAction() {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }
    setSelectedIds([]);
    if (selectedCount) return;
    setSelectionMode(false);
  }

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          selectionMode && selectedCount > 0 ? { paddingBottom: 100 } : null,
        ]}
        refreshControl={
          <RefreshControl refreshing={requestsQuery.isRefetching} onRefresh={() => requestsQuery.refetch()} />
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Delivery requests</Text>
          {isOnline && requestsQuery.data?.length ? (
            <Button title={headerActionLabel} variant="ghost" onPress={onHeaderAction} />
          ) : null}
        </View>
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
              selectable={selectionMode}
              selected={selectedIds.includes(request.id)}
              onToggleSelect={() => toggleSelect(request.id)}
              onAccept={() => handleAcceptSingle(request.id)}
              onReject={() => handleReject(request.id)}
              loading={accepting}
            />
          ))
        ) : (
          <EmptyState
            icon="radio-outline"
            title="No requests right now"
            message="Stay online — new delivery requests appear here automatically."
          />
        )}
      </ScrollView>
      {selectionMode && selectedCount > 0 ? (
        <View style={[styles.batchBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={typography.bodySmall}>{selectedCount} selected</Text>
          <Button
            title={accepting ? 'Accepting…' : `Accept ${selectedCount}`}
            onPress={handleAcceptBatch}
            loading={accepting}
            style={styles.batchBtn}
          />
        </View>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2 },
  batchBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  batchBtn: { minWidth: 160 },
});
